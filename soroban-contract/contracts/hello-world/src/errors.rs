use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidConfig = 1,
    InvalidAmount = 2,
    InvalidFeeModel = 3,
    AgentNotRegistered = 4,
    AgentNotActive = 5,
    RoleNotAllowed = 6,
    PolicyMismatch = 7,
    PolicyDisabled = 8,
    RequestNotFound = 9,
    RequestNotOpen = 10,
    NotRequestBorrower = 11,
    CannotFundOwnRequest = 12,
    CreditLimitExceeded = 13,
    LoanNotFound = 14,
    LoanNotActive = 15,
    NotLoanBorrower = 16,
    NotAdmin = 17,
    TooEarlyToDefault = 18,
    ProofRequired = 19,
    ProofExpired = 20,
    MathOverflow = 21,
    ProofReplayed = 22,
}
