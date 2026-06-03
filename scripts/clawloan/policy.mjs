import { LENDER_ID } from "./constants.mjs";
import { verifyEligibilityProof } from "./proof.mjs";
import { spendable } from "./money.mjs";

export function activeLenderExposure(state, lenderId = LENDER_ID) {
  return state.loans
    .filter((loan) => loan.status === "Active" && loan.lenderId === lenderId)
    .reduce((sum, loan) => sum + loan.principalXlm, 0);
}

export function evaluateRequest(state, request, lenderId = LENDER_ID) {
  const lender = state.agents[lenderId];
  const policy = state.lenderPolicy;
  const reputation = state.reputation[request.borrowerId];
  const exposure = activeLenderExposure(state, lenderId);
  const available = spendable(lender.balanceXlm, policy.reserveXlm);

  if (!policy.enabled) {
    return reject("Lender Policy is disabled.");
  }
  if (request.status !== "Open") {
    return reject(`Loan Request #${request.id} is ${request.status}, not Open.`);
  }
  if (request.borrowerId === lenderId) {
    return reject(`Loan Request #${request.id} belongs to the lender.`);
  }
  if (available < request.amountXlm) {
    return wait(`Available balance after reserve is ${available} XLM, below requested ${request.amountXlm} XLM.`);
  }
  if (request.amountXlm > policy.maxSingleLoanAmountXlm) {
    return reject(`Request amount ${request.amountXlm} XLM exceeds max_single_loan_amount ${policy.maxSingleLoanAmountXlm} XLM.`);
  }
  if (exposure + request.amountXlm > policy.maxTotalExposureXlm) {
    return wait(`Exposure would become ${exposure + request.amountXlm} XLM, above max_total_exposure ${policy.maxTotalExposureXlm} XLM.`);
  }
  if (request.feeModel.baseFeeBps < policy.minFeeBps) {
    return reject(`Base fee ${request.feeModel.baseFeeBps} bps is below min_fee_bps ${policy.minFeeBps}.`);
  }
  if (!feeModelIsValid(request.feeModel)) {
    return reject("Fee model is invalid.");
  }
  if (!reputation) {
    return wait(`Borrower reputation is unavailable for ${request.borrowerId}.`);
  }
  if (reputation.score < policy.minReputationScore) {
    return reject(`Borrower score ${reputation.score} is below min_reputation_score ${policy.minReputationScore}.`);
  }
  if (requestRequiresProof(request, policy)) {
    const proofResult = verifyEligibilityProof(state, request, reputation, policy);
    if (!proofResult.ok) {
      return reject(proofResult.reason);
    }
  }

  return {
    result: "pass",
    decision: "fund",
    reason: `Request #${request.id} passes reserve, exposure, fee, reputation, and proof checks.`,
    availableXlm: available,
    exposureXlm: exposure,
  };
}

export function selectBestRequest(state, lenderId = LENDER_ID) {
  const inspected = state.loanRequests
    .filter((request) => request.status === "Open")
    .map((request) => ({
      request,
      policyResult: evaluateRequest(state, request, lenderId),
    }));

  const eligible = inspected
    .filter((entry) => entry.policyResult.result === "pass")
    .sort((a, b) => {
      const feeDelta = b.request.feeModel.baseFeeBps - a.request.feeModel.baseFeeBps;
      if (feeDelta !== 0) {
        return feeDelta;
      }
      return a.request.createdAt - b.request.createdAt;
    });

  return {
    inspected,
    selected: eligible[0] || null,
  };
}

function feeModelIsValid(feeModel) {
  return (
    feeModel.baseFeeBps <= feeModel.maxFeeBps &&
    feeModel.stepSeconds > 0 &&
    feeModel.maxFeeBps <= 10_000
  );
}

function requestRequiresProof(request, policy) {
  return Boolean(
    request.privacyMode?.requireEligibilityProof ||
      request.privacyMode?.requireProof ||
      policy.requireEligibilityProof,
  );
}

function reject(reason) {
  return { result: "reject", decision: "reject", reason };
}

function wait(reason) {
  return { result: "wait", decision: "wait", reason };
}
