# Privacy Reference

ClawLoan's MVP privacy feature is selective reputation eligibility. It does not claim fully private payments, hidden counterparties, hidden token movements, or onchain ZK verification.

## Claim

Use this wording:

```text
ClawLoan lets a borrower disclose only the reputation facts needed for a lending decision, while keeping unnecessary repayment-history detail private.
```

Also state this limitation when relevant:

```text
We are not claiming fully private payments in the MVP. We are demonstrating selective disclosure for reputation.
```

## What Is Hidden

The skill and helper flow should avoid exposing:

- full repayment history in the lender-facing UI;
- exact prior loan amounts in the lender-facing UI;
- detailed late/default timeline in the lender-facing UI;
- readable request purpose in public contract storage.

## What Is Still Public

The MVP does not hide:

- borrower address stored on the Loan Request;
- lender address stored on the Loan;
- token movements visible through Stellar/Soroban;
- contract events and public state;
- facts known to the attestation issuer.

## Eligibility Attestation

The borrower may include an `EligibilityAttestation` reference:

```rust
pub struct EligibilityAttestation {
    pub attestation_hash: BytesN<32>,
    pub statement_hash: BytesN<32>,
    pub issuer: Address,
    pub nonce: BytesN<32>,
    pub expires_at: u64,
}
```

The local reputation helper signs or records a narrow statement, such as:

```text
Borrower <address> is eligible for Loan Request #<id> because score >= 50, credit limit covers 10 XLM, and defaults == 0. Expires at <timestamp>. Nonce <nonce>.
```

The lender skill/helper verifies the statement offchain before funding. The contract stores only the reference and does not verify the signature in the MVP.

## Privacy-Run Policy

For the privacy run:

- set `min_reputation_score = 50`;
- set `require_eligibility_attestation = true`;
- reject expired attestations;
- reject attestations that are not bound to the borrower and request;
- reject replayed or mismatched nonces.

If attestation verification fails, regenerate the attestation with the current request id or nonce instead of bypassing the check.

