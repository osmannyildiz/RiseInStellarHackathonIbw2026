export const DEFAULT_STATE_PATH = "generated/clawloan-demo-state.json";

export const DEMO = {
  network: "stellar-testnet",
  stateAdapter: "local-demo",
  borrowerReserveXlm: 2,
  lenderReserveXlm: 15,
  requestAmountXlm: 10,
  startingCreditLimitXlm: 20,
  maxSingleLoanXlm: 10,
  maxTotalExposureXlm: 20,
  minReputationScore: 50,
  baseFeeBps: 200,
  stepFeeBps: 100,
  stepSeconds: 15,
  maxFeeBps: 500,
  lateThresholdSeconds: 45,
  borrowerLowBalanceThresholdXlm: 12,
};

export const BORROWER_ID = "borrower-agent";
export const LENDER_ID = "lender-agent";
