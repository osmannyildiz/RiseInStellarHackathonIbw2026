import { createHash, randomBytes } from "node:crypto";
import { DEMO } from "./constants.mjs";

const LOCAL_ISSUER_ID = "local-reputation-helper";
const DEFAULT_TTL_SECONDS = 300;

export function createEligibilityAttestation(state, requestDraft, options = {}) {
  const borrower = state.agents[requestDraft.borrowerId];
  const reputation = state.reputation[requestDraft.borrowerId];
  const policy = state.lenderPolicy;
  const issuedAt = Number(options.issuedAt || Math.floor(Date.now() / 1000));
  const expiresAt = Number(options.expiresAt || issuedAt + Number(options.attestationTtlSeconds || DEFAULT_TTL_SECONDS));
  const nonce = options.nonce || hashHex(`${requestDraft.borrowerId}:${requestDraft.id}:${issuedAt}:${randomBytes(16).toString("hex")}`);
  const maxDefaults = Number(options.maxDefaults ?? policy.maxDefaults ?? 0);
  const minScore = Number(options.minScore ?? policy.minReputationScore ?? DEMO.minReputationScore);

  if (!borrower) {
    return { ok: false, reason: `Borrower agent ${requestDraft.borrowerId} is not configured.` };
  }
  if (!reputation) {
    return { ok: false, reason: `Borrower reputation is unavailable for ${requestDraft.borrowerId}.` };
  }
  if (reputation.score < minScore) {
    return {
      ok: false,
      reason: `Cannot issue Eligibility Attestation: borrower score is below required threshold ${minScore}.`,
    };
  }
  if (reputation.currentCreditLimitXlm < requestDraft.amountXlm) {
    return {
      ok: false,
      reason: `Cannot issue Eligibility Attestation: credit limit does not cover ${requestDraft.amountXlm} XLM.`,
    };
  }
  if (reputation.defaults > maxDefaults) {
    return {
      ok: false,
      reason: `Cannot issue Eligibility Attestation: defaults exceed accepted maximum ${maxDefaults}.`,
    };
  }

  const statement = canonicalStatement({
    schema: "clawloan/eligibility-attestation/v1",
    issuerId: LOCAL_ISSUER_ID,
    issuerAddress: state.attestationIssuer?.address || "GLOCALREPUTATIONHELPER000000000000000000000000000001",
    borrowerId: requestDraft.borrowerId,
    borrowerAddress: borrower.address,
    requestId: requestDraft.id,
    requestedAmountXlm: requestDraft.amountXlm,
    purposeHash: requestDraft.purposeHash,
    minScore,
    creditLimitCoversAmountXlm: requestDraft.amountXlm,
    maxDefaults,
    issuedAt,
    expiresAt,
    nonce,
  });
  const statementHash = hashHex(statement);
  const signatureHash = hashHex(`${LOCAL_ISSUER_ID}:${statementHash}`);
  const attestationHash = hashHex(canonicalStatement({ statementHash, signatureHash }));

  return {
    ok: true,
    attestation: {
      attestationHash,
      statementHash,
      issuer: state.attestationIssuer?.address || "GLOCALREPUTATIONHELPER000000000000000000000000000001",
      nonce,
      expiresAt,
      statement: JSON.parse(statement),
      signatureHash,
      verification: {
        method: "local-demo-hash-signature",
        limitation: "Offchain helper verification only; no onchain ZK or signature verification in the MVP.",
      },
    },
  };
}

export function verifyEligibilityAttestation(state, request, reputation, policy, options = {}) {
  const attestation = request.eligibilityAttestation;
  const now = Number(options.now || Math.floor(Date.now() / 1000));
  if (!attestation) {
    return { ok: false, reason: `Request #${request.id} requires an Eligibility Attestation, but none is attached.` };
  }
  if (!attestation.statement || !attestation.statementHash || !attestation.attestationHash || !attestation.nonce) {
    return { ok: false, reason: `Eligibility Attestation for request #${request.id} is incomplete.` };
  }
  if (attestation.expiresAt <= now) {
    return { ok: false, reason: `Eligibility Attestation for request #${request.id} is expired.` };
  }
  const usedNonces = state.usedAttestationNonces || [];
  if (usedNonces.includes(attestation.nonce)) {
    return { ok: false, reason: `Eligibility Attestation nonce for request #${request.id} was already used.` };
  }

  const statement = attestation.statement;
  if (
    statement.borrowerId !== request.borrowerId ||
    statement.borrowerAddress !== request.borrowerAddress ||
    statement.requestId !== request.id ||
    statement.requestedAmountXlm !== request.amountXlm ||
    statement.purposeHash !== request.purposeHash ||
    statement.nonce !== attestation.nonce ||
    statement.expiresAt !== attestation.expiresAt
  ) {
    return { ok: false, reason: `Eligibility Attestation is not bound to borrower ${request.borrowerId} and request #${request.id}.` };
  }

  const expectedStatementHash = hashHex(canonicalStatement(statement));
  if (expectedStatementHash !== attestation.statementHash) {
    return { ok: false, reason: `Eligibility Attestation statement hash does not match request #${request.id}.` };
  }
  const expectedSignatureHash = hashHex(`${LOCAL_ISSUER_ID}:${attestation.statementHash}`);
  const expectedAttestationHash = hashHex(canonicalStatement({
    statementHash: attestation.statementHash,
    signatureHash: expectedSignatureHash,
  }));
  if (attestation.signatureHash !== expectedSignatureHash || attestation.attestationHash !== expectedAttestationHash) {
    return { ok: false, reason: `Eligibility Attestation signature reference does not verify for request #${request.id}.` };
  }

  const minScore = Number(policy.minReputationScore || 0);
  const maxDefaults = Number(policy.maxDefaults ?? 0);
  if (statement.minScore < minScore) {
    return { ok: false, reason: "Eligibility Attestation does not satisfy the policy reputation threshold." };
  }
  if (statement.maxDefaults > maxDefaults) {
    return { ok: false, reason: "Eligibility Attestation allows more defaults than the policy accepts." };
  }
  if (Number(statement.creditLimitCoversAmountXlm) < request.amountXlm) {
    return { ok: false, reason: "Eligibility Attestation does not cover the requested amount." };
  }

  if (!reputation) {
    return { ok: false, reason: `Borrower reputation is unavailable for ${request.borrowerId}.` };
  }
  if (reputation.score < statement.minScore || reputation.currentCreditLimitXlm < request.amountXlm || reputation.defaults > statement.maxDefaults) {
    return { ok: false, reason: "Current borrower reputation no longer satisfies the attested eligibility facts." };
  }

  return {
    ok: true,
    statementHash: attestation.statementHash,
    attestationHash: attestation.attestationHash,
    reason: "Eligibility Attestation verifies score threshold, credit capacity, default bound, expiry, nonce, and request binding.",
  };
}

export function markAttestationNonceUsed(state, request) {
  const nonce = request.eligibilityAttestation?.nonce;
  if (!nonce) {
    return;
  }
  if (!state.usedAttestationNonces) {
    state.usedAttestationNonces = [];
  }
  if (!state.usedAttestationNonces.includes(nonce)) {
    state.usedAttestationNonces.push(nonce);
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
