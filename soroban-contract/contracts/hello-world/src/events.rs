use soroban_sdk::{contractevent, Address};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AgentRegistered {
    #[topic]
    pub agent: Address,
    pub created_at: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyUpdated {
    #[topic]
    pub lender: Address,
    pub max_single_loan_amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRequestPosted {
    #[topic]
    pub borrower: Address,
    pub loan_request_id: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRequestCancelled {
    #[topic]
    pub borrower: Address,
    pub loan_request_id: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanFunded {
    #[topic]
    pub lender: Address,
    pub loan_id: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRepaid {
    #[topic]
    pub borrower: Address,
    pub amount_due: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanDefaulted {
    #[topic]
    pub admin: Address,
    pub loan_id: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationChanged {
    #[topic]
    pub agent: Address,
    pub score: u32,
}
