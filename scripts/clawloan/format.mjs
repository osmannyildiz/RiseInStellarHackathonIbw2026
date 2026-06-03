import { formatXlm } from "./money.mjs";

export function formatLenderHeartbeat(result) {
  const { heartbeat } = result;
  const best = heartbeat.bestRequest
    ? `#${heartbeat.bestRequest.id} for ${formatXlm(heartbeat.bestRequest.amountXlm)}`
    : "none";

  const lines = [
    "Heartbeat result:",
    `- Adapter: local demo state (${result.funded ? "state updated" : "no funding action"})`,
    `- Balance: ${formatXlm(heartbeat.balanceXlm)}`,
    `- Reserve: ${formatXlm(heartbeat.reserveXlm)}`,
    `- Available to lend: ${formatXlm(heartbeat.availableXlm)}`,
    `- Current exposure: ${formatXlm(heartbeat.exposureXlm)}`,
    `- Open requests inspected: ${heartbeat.inspectedCount}`,
    `- Best Loan Request: ${best}`,
    `- Policy result: ${heartbeat.policyResult}`,
    `- Decision: ${heartbeat.decision}`,
    `- Reason: ${heartbeat.reason}`,
  ];

  if (result.funded) {
    lines.push(`- Funding transaction: ${result.txHash}`);
    lines.push(`- Loan id: #${result.loan.id}`);
    lines.push(`- Loan status: ${result.loan.status}`);
    if (heartbeat.bestRequest?.eligibilityAttestation) {
      lines.push(`- Eligibility Attestation: verified ${heartbeat.bestRequest.eligibilityAttestation.statementHash}`);
    }
  }

  return lines.join("\n");
}

export function formatBorrowerHeartbeat(result) {
  const { heartbeat } = result;
  const lines = [
    "Borrower heartbeat result:",
    "- Adapter: local demo state",
    `- Balance: ${formatXlm(heartbeat.balanceXlm)}`,
    `- Reserve: ${formatXlm(heartbeat.reserveXlm)}`,
    `- Active loans: ${heartbeat.activeLoanCount}`,
    `- Open requests: ${heartbeat.openRequestCount}`,
    `- Decision: ${heartbeat.decision}`,
    `- Reason: ${heartbeat.reason}`,
  ];

  if (result.loanRequest) {
    lines.push(`- Loan Request: #${result.loanRequest.id} for ${formatXlm(result.loanRequest.amountXlm)}`);
  }
  if (result.obligations) {
    for (const obligation of result.obligations) {
      lines.push(
        `- Loan #${obligation.loan.id} due now: ${formatXlm(obligation.due.amountDueXlm)} (${obligation.due.feeBps} bps fee)`,
      );
    }
  }

  return lines.join("\n");
}

export function formatPostRequest(result) {
  if (!result.ok) {
    return `Post Loan Request blocked:\n- Reason: ${result.reason}`;
  }

  return [
    result.reused ? "Existing Loan Request:" : "Loan Request posted:",
    "- Adapter: local demo state",
    `- Loan Request id: #${result.loanRequest.id}`,
    `- Borrower: ${result.loanRequest.borrowerAddress}`,
    `- Amount: ${formatXlm(result.loanRequest.amountXlm)}`,
    `- Privacy mode: purpose ${result.loanRequest.privacyMode.hidePurpose ? "hashed offchain" : "public"}, eligibility attestation ${result.loanRequest.privacyMode.requireEligibilityAttestation ? "required" : "not required"}`,
    result.loanRequest.eligibilityAttestation
      ? `- Eligibility Attestation: ${result.loanRequest.eligibilityAttestation.statementHash}`
      : null,
    `- Status: ${result.loanRequest.status}`,
    `- Reason: ${result.reason || "Known-good demo request created."}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatRepayment(result) {
  if (!result.ok) {
    return [
      "Repayment blocked:",
      "- Adapter: local demo state",
      `- Reason: ${result.reason}`,
      result.due ? `- Current amount due: ${formatXlm(result.due.amountDueXlm)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "Repayment result:",
    "- Adapter: local demo state",
    `- Loan id: #${result.loan.id}`,
    `- Current amount due: ${formatXlm(result.due.amountDueXlm)}`,
    `- Fee paid: ${formatXlm(result.due.feeXlm)}`,
    `- Repayment transaction: ${result.txHash}`,
    "- Status: Repaid",
  ].join("\n");
}

export function formatRecovery(state) {
  const openRequests = state.loanRequests.filter((request) => request.status === "Open");
  const activeLoans = state.loans.filter((loan) => loan.status === "Active");

  return [
    "Recovery snapshot:",
    `- Adapter: ${state.stateAdapter}`,
    `- Network: ${state.network}`,
    `- Contract ID: ${state.contractId || "not configured"}`,
    `- Open Loan Requests: ${openRequests.length}`,
    `- Active Loans: ${activeLoans.length}`,
    `- Loans Funded: ${state.networkStats.loansFunded}`,
    `- Loans Repaid: ${state.networkStats.loansRepaid}`,
    openRequests.length
      ? `- Suggested action: run lender heartbeat or cancel stale request #${openRequests[0].id}.`
      : null,
    activeLoans.length
      ? `- Suggested action: borrower heartbeat can report due amount; repay with repay-demo-loan only after explicit instruction.`
      : null,
    !openRequests.length && !activeLoans.length
      ? "- Suggested action: run borrower heartbeat or post-demo-loan-request to start a fresh demo."
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
