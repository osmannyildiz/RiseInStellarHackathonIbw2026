import { BORROWER_ID, DEMO, LENDER_ID } from "./constants.mjs";
import { createEligibilityAttestation, markAttestationNonceUsed } from "./attestation.mjs";
import { currentUnixTime } from "./demo-state.mjs";
import { amountDueAt, xlm } from "./money.mjs";
import { activeLenderExposure, selectBestRequest } from "./policy.mjs";

export function postDemoLoanRequest(state, options = {}) {
  const borrowerId = options.borrowerId || BORROWER_ID;
  const borrower = state.agents[borrowerId];
  const reputation = state.reputation[borrowerId];
  const amountXlm = Number(options.amountXlm || state.borrowerPolicy.targetRequestAmountXlm || DEMO.requestAmountXlm);
  const now = currentUnixTime();

  if (!borrower) {
    return { ok: false, reason: `Borrower agent ${borrowerId} is not configured.` };
  }
  if (!reputation) {
    return { ok: false, reason: `Borrower reputation is not configured for ${borrowerId}.` };
  }
  if (reputation.openBorrowedAmountXlm + amountXlm > reputation.currentCreditLimitXlm) {
    return {
      ok: false,
      reason: `Credit limit blocked: open borrowed amount ${reputation.openBorrowedAmountXlm} XLM + request ${amountXlm} XLM exceeds ${reputation.currentCreditLimitXlm} XLM.`,
    };
  }

  const existingOpen = state.loanRequests.find(
    (request) => request.borrowerId === borrowerId && request.status === "Open",
  );
  if (existingOpen && !options.allowDuplicateOpenRequest) {
    return {
      ok: true,
      reused: true,
      loanRequest: existingOpen,
      reason: `Open Loan Request #${existingOpen.id} already exists for ${borrowerId}.`,
    };
  }

  const requestId = state.nextLoanRequestId;
  const purposeHash = `local-demo-purpose-${now}`;
  const requireEligibilityAttestation =
    Boolean(options.requireEligibilityAttestation || options.privacyRun || state.lenderPolicy.requireEligibilityAttestation);
  const requestDraft = {
    id: requestId,
    borrowerId,
    borrowerAddress: borrower.address,
    amountXlm,
    purposeHash,
  };
  const attestationResult = requireEligibilityAttestation
    ? createEligibilityAttestation(state, requestDraft, options)
    : { ok: true, attestation: null };
  if (!attestationResult.ok) {
    return { ok: false, reason: attestationResult.reason };
  }

  const loanRequest = {
    id: state.nextLoanRequestId++,
    borrowerId,
    borrowerAddress: borrower.address,
    amountXlm,
    feeModel: { ...state.feeModel },
    purposeHash,
    privacyMode: {
      hidePurpose: true,
      requireEligibilityAttestation,
    },
    eligibilityAttestation: attestationResult.attestation,
    status: "Open",
    createdAt: now,
    fundedLoanId: null,
  };

  state.loanRequests.push(loanRequest);
  state.networkStats.loanRequestsPosted += 1;
  state.eventLog.push({
    type: "loan_request_posted",
    at: now,
    loanRequestId: loanRequest.id,
    borrowerId,
    amountXlm,
    privacyMode: loanRequest.privacyMode,
    attestationHash: loanRequest.eligibilityAttestation?.attestationHash || null,
  });

  return { ok: true, reused: false, loanRequest };
}

export function runLenderHeartbeatOnce(state, options = {}) {
  const lenderId = options.lenderId || LENDER_ID;
  const lender = state.agents[lenderId];
  const policy = state.lenderPolicy;
  const now = currentUnixTime();
  const selection = selectBestRequest(state, lenderId);
  const selected = selection.selected;
  const availableXlm = Math.max(0, lender.balanceXlm - policy.reserveXlm);
  const exposureXlm = activeLenderExposure(state, lenderId);

  if (!selected) {
    const firstBlocker = selection.inspected[0]?.policyResult;
    const reason = firstBlocker?.reason || "No open Loan Requests are available.";
    return {
      action: "wait",
      funded: false,
      heartbeat: {
        now,
        lenderId,
        balanceXlm: lender.balanceXlm,
        reserveXlm: policy.reserveXlm,
        availableXlm,
        exposureXlm,
        inspectedCount: selection.inspected.length,
        bestRequest: null,
        policyResult: firstBlocker?.result || "wait",
        decision: "wait",
        reason,
      },
      inspected: selection.inspected,
    };
  }

  const request = selected.request;
  const loanId = state.nextLoanId++;
  const loan = {
    id: loanId,
    loanRequestId: request.id,
    borrowerId: request.borrowerId,
    lenderId,
    principalXlm: request.amountXlm,
    feeModel: { ...request.feeModel },
    fundedAt: now,
    repaidAt: null,
    amountRepaidXlm: 0,
    status: "Active",
    privacyMode: { ...request.privacyMode },
  };

  request.status = "Funded";
  request.fundedLoanId = loanId;
  state.loans.push(loan);
  markAttestationNonceUsed(state, request);
  lender.balanceXlm = xlm(lender.balanceXlm - request.amountXlm);
  state.agents[request.borrowerId].balanceXlm = xlm(state.agents[request.borrowerId].balanceXlm + request.amountXlm);
  state.reputation[request.borrowerId].openBorrowedAmountXlm = xlm(
    state.reputation[request.borrowerId].openBorrowedAmountXlm + request.amountXlm,
  );
  state.reputation[request.borrowerId].totalBorrowedXlm = xlm(
    state.reputation[request.borrowerId].totalBorrowedXlm + request.amountXlm,
  );
  state.networkStats.loansFunded += 1;
  state.networkStats.totalXlmLent = xlm(state.networkStats.totalXlmLent + request.amountXlm);

  const txHash = `local-demo-fund-${request.id}-${loanId}-${now}`;
  state.eventLog.push({
    type: "loan_funded",
    at: now,
    loanRequestId: request.id,
    loanId,
    borrowerId: request.borrowerId,
    lenderId,
    amountXlm: request.amountXlm,
    txHash,
  });

  return {
    action: "fund",
    funded: true,
    loan,
    txHash,
    heartbeat: {
      now,
      lenderId,
      balanceXlm: lender.balanceXlm + request.amountXlm,
      reserveXlm: policy.reserveXlm,
      availableXlm,
      exposureXlm,
      inspectedCount: selection.inspected.length,
      bestRequest: request,
      policyResult: selected.policyResult.result,
      decision: "fund",
      reason: selected.policyResult.reason,
    },
    inspected: selection.inspected,
  };
}

export function runBorrowerHeartbeatOnce(state, options = {}) {
  const borrowerId = options.borrowerId || BORROWER_ID;
  const borrower = state.agents[borrowerId];
  const policy = state.borrowerPolicy;
  const activeLoans = state.loans.filter((loan) => loan.borrowerId === borrowerId && loan.status === "Active");
  const now = currentUnixTime();

  if (activeLoans.length > 0) {
    const obligations = activeLoans.map((loan) => ({ loan, due: amountDueAt(loan, now) }));
    return {
      action: "track_repayment",
      heartbeat: {
        now,
        borrowerId,
        balanceXlm: borrower.balanceXlm,
        reserveXlm: policy.reserveXlm,
        activeLoanCount: activeLoans.length,
        openRequestCount: openBorrowerRequests(state, borrowerId).length,
        decision: "track_repayment",
        reason: "Active loan exists; borrower heartbeat reports amount due and waits for explicit repayment instruction.",
      },
      obligations,
    };
  }

  const balanceIsLow = borrower.balanceXlm < policy.lowBalanceThresholdXlm;
  const openRequests = openBorrowerRequests(state, borrowerId);
  if (balanceIsLow && openRequests.length === 0 && policy.autoPostLoanRequest) {
    const posted = postDemoLoanRequest(state, { borrowerId });
    return {
      action: posted.ok ? "post_request" : "wait",
      heartbeat: {
        now,
        borrowerId,
        balanceXlm: borrower.balanceXlm,
        reserveXlm: policy.reserveXlm,
        activeLoanCount: 0,
        openRequestCount: openRequests.length,
        decision: posted.ok ? "post_request" : "wait",
        reason: posted.ok
          ? `Balance ${borrower.balanceXlm} XLM is below low-balance threshold ${policy.lowBalanceThresholdXlm} XLM; posted Loan Request #${posted.loanRequest.id}.`
          : posted.reason,
      },
      loanRequest: posted.loanRequest,
    };
  }

  return {
    action: "wait",
    heartbeat: {
      now,
      borrowerId,
      balanceXlm: borrower.balanceXlm,
      reserveXlm: policy.reserveXlm,
      activeLoanCount: 0,
      openRequestCount: openRequests.length,
      decision: "wait",
      reason: balanceIsLow
        ? "Balance is low, but an open Loan Request already exists or auto posting is disabled."
        : "Balance is above the low-balance threshold.",
    },
  };
}

export function repayDemoLoan(state, options = {}) {
  const borrowerId = options.borrowerId || BORROWER_ID;
  const borrower = state.agents[borrowerId];
  const now = currentUnixTime();
  const loan = state.loans.find((candidate) => candidate.borrowerId === borrowerId && candidate.status === "Active");

  if (!loan) {
    return { ok: false, reason: `No active loan exists for ${borrowerId}.` };
  }

  const due = amountDueAt(loan, now);
  if (borrower.balanceXlm - borrower.reserveXlm < due.amountDueXlm) {
    return {
      ok: false,
      loan,
      due,
      reason: `Borrower spendable balance is below current amount due ${due.amountDueXlm} XLM.`,
    };
  }

  const lender = state.agents[loan.lenderId];
  borrower.balanceXlm = xlm(borrower.balanceXlm - due.amountDueXlm);
  lender.balanceXlm = xlm(lender.balanceXlm + due.amountDueXlm);
  loan.status = "Repaid";
  loan.repaidAt = now;
  loan.amountRepaidXlm = due.amountDueXlm;

  const reputation = state.reputation[borrowerId];
  reputation.openBorrowedAmountXlm = xlm(reputation.openBorrowedAmountXlm - loan.principalXlm);
  reputation.totalRepaidXlm = xlm(reputation.totalRepaidXlm + due.amountDueXlm);
  if (due.elapsed < DEMO.lateThresholdSeconds) {
    reputation.successfulRepayments += 1;
    reputation.score += 5;
    reputation.currentCreditLimitXlm = Math.max(
      reputation.currentCreditLimitXlm,
      Math.min(reputation.currentCreditLimitXlm + loan.principalXlm, DEMO.maxTotalExposureXlm),
    );
  } else {
    reputation.lateRepayments += 1;
    reputation.score = Math.max(0, reputation.score - 7);
  }

  state.networkStats.loansRepaid += 1;
  state.networkStats.totalFeesPaidXlm = xlm(state.networkStats.totalFeesPaidXlm + due.feeXlm);
  state.networkStats.totalRepaymentSeconds += due.elapsed;

  const txHash = `local-demo-repay-${loan.id}-${now}`;
  state.eventLog.push({
    type: "loan_repaid",
    at: now,
    loanId: loan.id,
    borrowerId,
    amountDueXlm: due.amountDueXlm,
    feeXlm: due.feeXlm,
    txHash,
  });

  return { ok: true, loan, due, txHash };
}

function openBorrowerRequests(state, borrowerId) {
  return state.loanRequests.filter((request) => request.borrowerId === borrowerId && request.status === "Open");
}
