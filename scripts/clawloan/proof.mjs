import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { DEMO } from "./constants.mjs";

const DEFAULT_TTL_SECONDS = 300;
const VERIFIER_ID = "groth16-bls12-381";
const DEMO_VERIFIER_ADDRESS = "GDEMOZKVERIFIER000000000000000000000000000000000001";
const DEFAULT_PROOF_RECEIPT_PATH = "zk/eligibility/build/proof-receipt.json";
const PUBLIC_SIGNAL_ORDER = [
  "minScore",
  "requestedAmountXlm",
  "maxDefaults",
  "requestId",
  "reputationRoot",
  "nullifierHash",
];

export function createEligibilityProofEnvelope(state, requestDraft, options = {}) {
  const borrower = state.agents[requestDraft.borrowerId];
  const reputation = state.reputation[requestDraft.borrowerId];
  const policy = state.lenderPolicy;
  const issuedAt = Number(options.issuedAt || Math.floor(Date.now() / 1000));
  const expiresAt = Number(options.expiresAt || issuedAt + Number(options.proofTtlSeconds || DEFAULT_TTL_SECONDS));
  const nonce = options.nonce || hashHex(`${requestDraft.borrowerId}:${requestDraft.id}:${issuedAt}:${randomBytes(16).toString("hex")}`);
  const maxDefaults = Number(options.maxDefaults ?? policy.maxDefaults ?? 0);
  const minScore = Number(options.minScore ?? policy.minReputationScore ?? DEMO.minReputationScore);

  if (!borrower) {
    return { ok: false, reason: `Borrower agent ${requestDraft.borrowerId} is not configured.` };
  }
  if (!reputation) {
    return { ok: false, reason: `Borrower reputation is unavailable for ${requestDraft.borrowerId}.` };
  }

  const receipt = loadProofReceipt(state, requestDraft, options);
  if (!receipt.ok && !options.allowDemoProofEnvelope) {
    return {
      ok: false,
      reason: `${receipt.reason} Run scripts/clawloan/generate-eligibility-proof or pass --allow-demo-proof-envelope for a non-private fallback.`,
    };
  }

  const privateWitness = {
    score: reputation.score,
    currentCreditLimitXlm: reputation.currentCreditLimitXlm,
    defaults: reputation.defaults,
    successfulRepayments: reputation.successfulRepayments,
    lateRepayments: reputation.lateRepayments,
    totalBorrowedXlm: reputation.totalBorrowedXlm,
    totalRepaidXlm: reputation.totalRepaidXlm,
  };
  const reputationRoot = hashHex(canonicalStatement({
    schema: "clawloan/reputation-witness/v1",
    borrowerAddress: borrower.address,
    witness: privateWitness,
  }));
  const publicInputs = {
    schema: "clawloan/zk-eligibility/v1",
    verifierId: VERIFIER_ID,
    borrowerAddress: borrower.address,
    requestId: receipt.ok ? Number(receipt.publicInputs.requestId) : requestDraft.id,
    requestedAmountXlm: receipt.ok ? Number(receipt.publicInputs.requestedAmountXlm) : requestDraft.amountXlm,
    purposeHash: requestDraft.purposeHash,
    minScore: receipt.ok ? Number(receipt.publicInputs.minScore) : minScore,
    maxDefaults: receipt.ok ? Number(receipt.publicInputs.maxDefaults) : maxDefaults,
    reputationRoot: receipt.ok ? receipt.publicInputs.reputationRoot : reputationRoot,
    nullifierHash: receipt.ok ? receipt.publicInputs.nullifierHash : hashHex(`${borrower.address}:${requestDraft.id}:${nonce}`),
    expiresAt,
  };
  const publicInputsHash = hashHex(canonicalStatement(publicInputs));
  const proofHash = receipt.ok
    ? receipt.receipt.proofHash
    : hashHex(canonicalStatement({
      publicInputsHash,
      proofBytesHash: options.proofBytesHash || "demo-proof-bytes-missing",
      verifierId: VERIFIER_ID,
    }));

  return {
    ok: true,
    proof: {
      proofHash,
      publicInputsHash,
      reputationRoot: publicInputs.reputationRoot,
      nullifierHash: publicInputs.nullifierHash,
      verifier: state.zkVerifier?.address || DEMO_VERIFIER_ADDRESS,
      expiresAt,
      publicInputs,
      verification: {
        method: VERIFIER_ID,
        status: receipt.ok ? "verified" : "demo-envelope",
        receiptPath: receipt.ok ? receipt.path : null,
        receiptHash: receipt.ok ? hashHex(canonicalStatement(receipt.receipt)) : null,
        circuitPublicSignalsHash: receipt.ok ? receipt.receipt.publicInputsHash : null,
        verificationKeyHash: receipt.ok ? receipt.receipt.verificationKeyHash : null,
        limitation: receipt.ok
          ? "Groth16/BLS12-381 proof verified by the local demo verifier receipt."
          : "This is a commitment and public-input envelope only. It is not privacy until a real Groth16/BLS12-381 proof verifies against these inputs.",
      },
    },
  };
}

export function verifyEligibilityProof(state, request, reputation, policy, options = {}) {
  const proof = request.eligibilityProof;
  const now = Number(options.now || Math.floor(Date.now() / 1000));
  if (!proof) {
    return { ok: false, reason: `Request #${request.id} requires a cryptographic Eligibility Proof, but none is attached.` };
  }
  if (!proof.publicInputs || !proof.publicInputsHash || !proof.proofHash || !proof.nullifierHash) {
    return { ok: false, reason: `Eligibility Proof for request #${request.id} is incomplete.` };
  }
  if (proof.expiresAt <= now) {
    return { ok: false, reason: `Eligibility Proof for request #${request.id} is expired.` };
  }
  const usedNullifiers = state.usedProofNullifiers || [];
  if (usedNullifiers.includes(proof.nullifierHash)) {
    return { ok: false, reason: `Eligibility Proof nullifier for request #${request.id} was already used.` };
  }

  const publicInputs = proof.publicInputs;
  if (
    publicInputs.borrowerAddress !== request.borrowerAddress ||
    publicInputs.requestId !== request.id ||
    publicInputs.requestedAmountXlm !== request.amountXlm ||
    publicInputs.purposeHash !== request.purposeHash ||
    publicInputs.nullifierHash !== proof.nullifierHash ||
    publicInputs.expiresAt !== proof.expiresAt
  ) {
    return { ok: false, reason: `Eligibility Proof is not bound to borrower ${request.borrowerId} and request #${request.id}.` };
  }

  const expectedPublicInputsHash = hashHex(canonicalStatement(publicInputs));
  if (expectedPublicInputsHash !== proof.publicInputsHash) {
    return { ok: false, reason: `Eligibility Proof public inputs hash does not match request #${request.id}.` };
  }

  const minScore = Number(policy.minReputationScore || 0);
  const maxDefaults = Number(policy.maxDefaults ?? 0);
  if (publicInputs.minScore < minScore) {
    return { ok: false, reason: "Eligibility Proof public inputs do not satisfy the policy reputation threshold." };
  }
  if (publicInputs.maxDefaults > maxDefaults) {
    return { ok: false, reason: "Eligibility Proof public inputs allow more defaults than the policy accepts." };
  }

  if (!proof.verification || proof.verification.method !== VERIFIER_ID) {
    return { ok: false, reason: "Eligibility Proof is missing a Groth16/BLS12-381 verification receipt." };
  }
  if (proof.verification.status !== "verified" && !policy.allowDemoProofEnvelope) {
    return {
      ok: false,
      reason: "Eligibility Proof has only a demo envelope. Real privacy requires a verified Groth16/BLS12-381 proof receipt.",
    };
  }

  if (reputation && (reputation.score < publicInputs.minScore || reputation.defaults > publicInputs.maxDefaults)) {
    return { ok: false, reason: "Current borrower reputation no longer satisfies the proof public inputs." };
  }

  return {
    ok: true,
    publicInputsHash: proof.publicInputsHash,
    proofHash: proof.proofHash,
    reason: "Eligibility Proof is bound to request public inputs and has an accepted verifier receipt.",
  };
}

export function markProofNullifierUsed(state, request) {
  const nullifierHash = request.eligibilityProof?.nullifierHash;
  if (!nullifierHash) {
    return;
  }
  if (!state.usedProofNullifiers) {
    state.usedProofNullifiers = [];
  }
  if (!state.usedProofNullifiers.includes(nullifierHash)) {
    state.usedProofNullifiers.push(nullifierHash);
  }
}

function hashHex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function loadProofReceipt(state, requestDraft, options) {
  if (options.verifiedProof) {
    return {
      ok: true,
      path: "caller-supplied",
      publicInputs: {
        minScore: String(options.minScore ?? state.lenderPolicy.minReputationScore ?? DEMO.minReputationScore),
        requestedAmountXlm: String(requestDraft.amountXlm),
        maxDefaults: String(options.maxDefaults ?? state.lenderPolicy.maxDefaults ?? 0),
        requestId: String(requestDraft.id),
        reputationRoot: options.reputationRoot || hashHex(`caller-supplied:${requestDraft.id}`),
        nullifierHash: options.nullifierHash || hashHex(`caller-supplied:${requestDraft.id}:${Date.now()}`),
      },
      receipt: {
        proofHash: options.proofBytesHash || hashHex(`caller-supplied-proof:${requestDraft.id}`),
        publicInputsHash: options.publicInputsHash || null,
        verificationKeyHash: options.verificationKeyHash || null,
      },
    };
  }

  const receiptPath = options.proofReceipt || state.zkVerifier?.proofReceiptPath || DEFAULT_PROOF_RECEIPT_PATH;
  if (!existsSync(receiptPath)) {
    return { ok: false, reason: `Groth16/BLS12-381 proof receipt not found at ${receiptPath}.` };
  }

  try {
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    if (receipt.method !== VERIFIER_ID || receipt.status !== "verified") {
      return { ok: false, reason: `Proof receipt ${receiptPath} is not a verified ${VERIFIER_ID} receipt.` };
    }
    if (!Array.isArray(receipt.publicSignals) || receipt.publicSignals.length < PUBLIC_SIGNAL_ORDER.length) {
      return { ok: false, reason: `Proof receipt ${receiptPath} does not include the expected public signals.` };
    }

    const publicInputs = publicSignalsToInputs(receipt.publicSignals);
    const mismatches = [];
    comparePublicInput(mismatches, "requestId", publicInputs.requestId, requestDraft.id);
    comparePublicInput(mismatches, "requestedAmountXlm", publicInputs.requestedAmountXlm, requestDraft.amountXlm);
    comparePublicInput(mismatches, "minScore", publicInputs.minScore, options.minScore ?? state.lenderPolicy.minReputationScore ?? DEMO.minReputationScore);
    comparePublicInput(mismatches, "maxDefaults", publicInputs.maxDefaults, options.maxDefaults ?? state.lenderPolicy.maxDefaults ?? 0);
    if (mismatches.length > 0) {
      return { ok: false, reason: `Proof receipt ${receiptPath} is not bound to this request: ${mismatches.join(", ")}.` };
    }

    return { ok: true, path: receiptPath, receipt, publicInputs };
  } catch (error) {
    return { ok: false, reason: `Could not read proof receipt ${receiptPath}: ${error.message}` };
  }
}

function publicSignalsToInputs(publicSignals) {
  return PUBLIC_SIGNAL_ORDER.reduce((result, key, index) => {
    result[key] = String(publicSignals[index]);
    return result;
  }, {});
}

function comparePublicInput(mismatches, label, actual, expected) {
  if (String(actual) !== String(expected)) {
    mismatches.push(`${label} expected ${expected} got ${actual}`);
  }
}

function canonicalStatement(value) {
  return JSON.stringify(sortObject(value));
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = sortObject(value[key]);
        return result;
      }, {});
  }
  return value;
}
