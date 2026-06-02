# Privacy Strategy

The recommended privacy focus is selective reputation eligibility. It directly supports the trust mechanism: a borrower should be able to present an Eligibility Attestation for a loan without exposing its full repayment history, prior loan amounts, or strategy to the lender-facing UI.

This is stronger than a generic "private intent" story because it answers a real lender question: can this borrower be trusted enough for this request?

## Summary

ClawLoan's MVP privacy feature protects reputation data. A lender does not need to see every previous loan to decide whether to fund a borrower. It only needs the eligibility facts required by its policy. ClawLoan lets the borrower reveal those facts while keeping unnecessary repayment-history detail out of public contract storage and out of the lender-facing UI.

This makes the privacy story practical rather than decorative: selective disclosure can reduce strategic leakage while preserving enough trust for the lending decision.

## Privacy Claim

For the MVP, the product should claim:

> ClawLoan lets a borrower disclose only the reputation facts needed for a lending decision, while keeping unnecessary repayment-history detail private.

The product should not claim that all lending activity is fully private. Soroban contract storage and token transfers are public unless a dedicated privacy mechanism is used, and that is outside the MVP.

The honest pitch is:

```text
We are not claiming fully private payments in the MVP. We are demonstrating selective disclosure for reputation, which is the most important private data in unsecured agent lending.
```

## What Is Hidden

The selective reputation flow aims to hide:

- full repayment history from the lender-facing UI;
- exact prior loan amounts from the lender-facing UI;
- detailed default/late-payment timeline from the lender-facing UI;
- private request purpose text from public contract storage.

It does not hide:

- the public borrower address if the MVP request stores it;
- the public lender address if the MVP loan stores it;
- token movements visible through normal Stellar/Soroban observation;
- information known to the attestation issuer or proof-generation service.

## What Is Revealed

The borrower reveals only the facts needed for the lender's Lender Policy:

- reputation score is above the lender threshold;
- current credit limit is enough for the requested amount;
- default count is within the accepted range;
- the Eligibility Attestation is bound to this request and cannot be replayed elsewhere.

## Threat Model

The main adversary is another market participant watching public activity to infer an agent's strategy, credit history, or counterparties. The privacy layer should reduce unnecessary disclosure while still letting lenders make responsible decisions.

This does not protect against every chain-analysis attack in the MVP. Public settlement addresses, token movements, and contract events may still leak information unless the implementation uses stronger privacy mechanisms.

## Recommended MVP Path

Use a two-level privacy plan, with Level 1 as the committed MVP path.

### Level 1: Signed Eligibility Attestation

This is the committed MVP path.

1. Reputation is derived from onchain repayment events.
2. A local reputation script computes eligibility facts from testnet repayment history.
3. The script signs a narrow eligibility statement, such as "score >= 50 and defaults == 0 for Loan Request #7."
4. The borrower includes an `EligibilityAttestation` reference with the Loan Request.
5. The lender skill verifies the signed statement offchain before funding.
6. The contract stores the attestation reference and public Loan Request state.

This is not full ZK, but it demonstrates selective disclosure cleanly: the lender gets the eligibility fact, not the full history. The pitch must call it an Eligibility Attestation, not an onchain zero-knowledge proof.

### Level 2: Onchain ZK Verifier Stretch

Only attempt this after the lending contract, skill flow, target-agent validation, and Eligibility Attestation flow are working. The proof statement should be narrow:

```text
I know repayment-history records committed under this reputation root,
and for this request:
- my reputation score is >= required_score;
- my credit limit is >= requested_amount;
- my default count is <= max_defaults;
- this proof is bound to the Loan Request id and nonce.
```

Public inputs:

- reputation root or commitment;
- Loan Request id;
- requested amount;
- lender threshold;
- nonce;
- proof expiration.

Private inputs:

- repayment records;
- prior counterparties;
- prior loan amounts;
- exact repayment timing;
- any internal scoring details.

The verifier should only answer whether the statement is valid. Business logic should remain separate: the lending contract decides whether a valid proof satisfies the lender policy.

## ZK Capability Notes

Do not commit to an onchain ZK verifier until the team has verified the target Stellar network, SDK support, proof tooling, verifier cost, and end-to-end reliability. The MVP does not need onchain ZK verification. Its privacy claim is selective disclosure through an Eligibility Attestation.

## Product Data Mapping

Existing structures already support the privacy path:

- `LoanRequest.eligibility_attestation`
- `LoanRequest.purpose_hash`
- `AgentProfile.public_metadata_hash`
- `PrivacyMode.require_eligibility_attestation`

The planned Eligibility Attestation reference is:

```rust
pub struct EligibilityAttestation {
    pub attestation_hash: BytesN<32>,
    pub statement_hash: BytesN<32>,
    pub issuer: Address,
    pub nonce: BytesN<32>,
    pub expires_at: u64,
}
```

This makes issuer tracking, replay protection, and statement binding explicit. The MVP can verify the signed statement in the skill or helper script before funding; the contract does not need to verify the signature unless that becomes a later implementation goal.

## Demo Script

The privacy demo can be simple:

1. Borrower agent wants 10 XLM.
2. Lender policy requires reputation score >= 50 and no defaults.
3. Borrower does not reveal full repayment history to the lender UI.
4. Borrower provides an Eligibility Attestation.
5. Lender skill verifies the signed statement and funds the request if policy matches.
6. Landing page explains that the full history was not exposed.

This gives the Privacy track a concrete story tied to the lending product, without overclaiming full confidential payments.

## Open Privacy Decisions

- Who issues the Eligibility Attestation for the testnet flow: a local indexer script or a dedicated reputation agent?
- Should private request purpose be shown as a hash-only commitment, or should the lender receive purpose text offchain?
- How much proof detail should the landing page expose to be credible without confusing judges?
