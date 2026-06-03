import { createHash, randomBytes } from "node:crypto";
import { DEMO } from "./constants.mjs";

const DEFAULT_TTL_SECONDS = 300;
const VERIFIER_ID = "groth16-bls12-381";
const DEMO_VERIFIER_ADDRESS = "GDEMOZKVERIFIER000000000000000000000000000000000001";

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
    requestId: requestDraft.id,
    requestedAmountXlm: requestDraft.amountXlm,
    purposeHash: requestDraft.purposeHash,
    minScore,
    maxDefaults,
    reputationRoot,
    nullifierHash: hashHex(`${borrower.address}:${requestDraft.id}:${nonce}`),
    expiresAt,
  };
  const publicInputsHash = hashHex(canonicalStatement(publicInputs));
  const proofHash = hashHex(canonicalStatement({
    publicInputsHash,
    proofBytesHash: options.proofBytesHash || "demo-proof-bytes-missing",
    verifierId: VERIFIER_ID,
  }));

  return {
    ok: true,
    proof: {
      proofHash,
      publicInputsHash,
      reputationRoot,
      nullifierHash: publicInputs.nullifierHash,
      verifier: state.zkVerifier?.address || DEMO_VERIFIER_ADDRESS,
      expiresAt,
      publicInputs,
      verification: {
        method: VERIFIER_ID,
        status: options.verifiedProof ? "verified" : "demo-envelope",
        limitation: options.verifiedProof
          ? "Groth16/BLS12-381 verifier receipt supplied by caller."
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
