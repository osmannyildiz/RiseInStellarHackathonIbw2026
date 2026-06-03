import { BORROWER_ID, DEFAULT_STATE_PATH, DEMO, LENDER_ID } from "./constants.mjs";

export function createDefaultState() {
  const now = currentUnixTime();

  return {
    schemaVersion: 1,
    generatedAt: now,
    statePath: DEFAULT_STATE_PATH,
    network: DEMO.network,
    stateAdapter: DEMO.stateAdapter,
    contractId: null,
    tokenAddress: "native-xlm-sac-testnet-placeholder",
    agents: {
      [BORROWER_ID]: {
        id: BORROWER_ID,
        role: "Borrower",
        address: "GDEMOCLAWLOANBORROWER000000000000000000000000000000001",
        balanceXlm: 3,
        reserveXlm: DEMO.borrowerReserveXlm,
        lowBalanceThresholdXlm: DEMO.borrowerLowBalanceThresholdXlm,
        purposeText: "short-term testnet operating liquidity",
      },
      [LENDER_ID]: {
        id: LENDER_ID,
        role: "Lender",
        address: "GDEMOCLAWLOANLENDER0000000000000000000000000000000002",
        balanceXlm: 42,
        reserveXlm: DEMO.lenderReserveXlm,
      },
    },
    lenderPolicy: {
      enabled: true,
      reserveXlm: DEMO.lenderReserveXlm,
      maxSingleLoanAmountXlm: DEMO.maxSingleLoanXlm,
      maxTotalExposureXlm: DEMO.maxTotalExposureXlm,
      minReputationScore: DEMO.minReputationScore,
      maxDefaults: 0,
      minFeeBps: DEMO.baseFeeBps,
      maxDurationSeconds: DEMO.lateThresholdSeconds,
      allowRepeatBorrower: true,
      requireEligibilityProof: false,
      allowDemoProofEnvelope: false,
    },
    borrowerPolicy: {
      reserveXlm: DEMO.borrowerReserveXlm,
      lowBalanceThresholdXlm: DEMO.borrowerLowBalanceThresholdXlm,
      targetRequestAmountXlm: DEMO.requestAmountXlm,
      autoPostLoanRequest: true,
    },
    feeModel: {
      baseFeeBps: DEMO.baseFeeBps,
      stepFeeBps: DEMO.stepFeeBps,
      stepSeconds: DEMO.stepSeconds,
      maxFeeBps: DEMO.maxFeeBps,
    },
    reputation: {
      [BORROWER_ID]: {
        agentId: BORROWER_ID,
        score: 50,
        successfulRepayments: 0,
        lateRepayments: 0,
        defaults: 0,
        totalBorrowedXlm: 0,
        totalRepaidXlm: 0,
        currentCreditLimitXlm: DEMO.startingCreditLimitXlm,
        openBorrowedAmountXlm: 0,
      },
    },
    loanRequests: [],
    loans: [],
    networkStats: {
      loanRequestsPosted: 0,
      loansFunded: 0,
      loansRepaid: 0,
      totalXlmLent: 0,
      totalFeesPaidXlm: 0,
      totalRepaymentSeconds: 0,
    },
    zkVerifier: {
      id: "groth16-bls12-381",
      address: "GDEMOZKVERIFIER000000000000000000000000000000000001",
      proofReceiptPath: "zk/eligibility/build/proof-receipt.json",
    },
    usedProofNullifiers: [],
    eventLog: [],
    nextLoanRequestId: 1,
    nextLoanId: 1,
  };
}

export function currentUnixTime() {
  return Math.floor(Date.now() / 1000);
}
