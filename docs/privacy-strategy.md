# Privacy Strategy

The recommended privacy focus is selective reputation eligibility. It directly supports the trust mechanism: a borrower should be able to present an eligibility attestation for a loan without exposing its full repayment history, prior loan amounts, or strategy to the lender-facing UI.

This is stronger than a generic "private intent" story because it answers a real lender question: can this borrower be trusted enough for this request?

## Jury-Friendly Summary

ClawLoan's MVP privacy feature protects reputation data where privacy matters most. A lender does not need to see every previous loan to decide whether to fund a borrower. It only needs the eligibility facts required by its policy. ClawLoan lets the borrower reveal those facts while keeping unnecessary repayment-history detail out of public contract storage and out of the lender-facing UI.

This makes the privacy story practical rather than decorative: privacy improves the lending market by reducing strategic leakage while preserving trust.

## Privacy Claim

For the hackathon MVP, the product should claim:

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

The borrower reveals only the facts needed for the lender's investment policy:

- reputation score is above the lender threshold;
- current credit limit is enough for the requested amount;
- default count is within the accepted range;
- the proof or attestation is bound to this request and cannot be replayed elsewhere.

## Threat Model

The main adversary is another market participant watching public activity to infer an agent's strategy, credit history, or counterparties. The privacy layer should reduce unnecessary disclosure while still letting lenders make responsible decisions.

This does not protect against every chain-analysis attack in the MVP. Public settlement addresses, token movements, and contract events may still leak information unless the implementation uses stronger privacy mechanisms.

## Recommended MVP Path

Use a two-level privacy plan, with Level 1 as the committed MVP path.

### Level 1: Signed Eligibility Attestation

This is the committed hackathon path.

1. Reputation is derived from onchain repayment events.
2. A local reputation script or reputation agent computes private eligibility facts for the demo.
3. The script signs a narrow eligibility statement, such as "score >= 50 and defaults == 0 for request #7."
4. The borrower includes a `ReputationProofRef` for that signed statement with the lending request.
5. The lender skill verifies that the statement satisfies its policy.
6. The contract stores only the proof reference and public request state.

This is not full ZK, but it demonstrates selective disclosure cleanly: the lender gets the eligibility fact, not the full history. The pitch must call it a signed eligibility attestation or proof reference, not an onchain zero-knowledge proof.

### Level 2: Onchain ZK Verifier Stretch

Only attempt this after the lending contract, skill flow, real-agent demo, and signed-attestation privacy flow are working. The proof statement should be narrow:

```text
I know repayment-history records committed under this reputation root,
and for this request:
- my reputation score is >= required_score;
- my credit limit is >= requested_amount;
- my default count is <= max_defaults;
- this proof is bound to request_id and nonce.
```

Public inputs:

- reputation root or commitment;
- request id;
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

## Stellar ZK Capability Notes

ZK implementation must be capability-gated. Before relying on a proof system, verify the target network protocol, SDK support, and examples.

Current planning notes as of June 3, 2026:

- BLS12-381 host functions are specified in CAP-0059 with status `Final` and protocol version 22.
- BN254 host functions are specified in CAP-0074 with status `Final` and protocol version 25.
- Poseidon/Poseidon2 host functions are specified in CAP-0075 with status `Final` and protocol version 25.
- Stellar software versions list Protocol 25 on testnet and mainnet, with SDK and host environment versions for Protocol 25.

This means an onchain ZK path may be plausible, but it is not part of the committed MVP until the project verifies local tooling, deployed network support, proof generation, verifier cost, and end-to-end demo reliability.

## Product Data Mapping

Existing structures already support the privacy path:

- `LendingRequest.reputation_proof`
- `LendingRequest.purpose_hash`
- `AgentProfile.public_metadata_hash`
- `PrivacyMode.require_reputation_proof`

The planned proof-reference structure is:

```rust
pub struct ReputationProofRef {
    pub proof_hash: BytesN<32>,
    pub statement_hash: BytesN<32>,
    pub expires_at: u64,
    pub nonce: BytesN<32>,
}
```

This makes replay protection and statement binding explicit.

## Demo Script

The privacy demo can be simple:

1. Borrower agent wants 10 XLM.
2. Lender policy requires reputation score >= 50 and no defaults.
3. Borrower does not reveal full repayment history to the lender UI.
4. Borrower provides a signed eligibility proof reference.
5. Lender skill verifies the reference and funds the request.
6. Landing page explains that the full history was not exposed.

This gives the Privacy track a concrete story tied to the lending product, without overclaiming full confidential payments.

## Open Privacy Decisions

- Who issues the eligibility attestation in the demo: a local indexer script or a dedicated reputation agent?
- Should private request purpose be shown as a hash-only commitment, or should the lender receive purpose text offchain?
- How much proof detail should the landing page expose to be credible without confusing judges?
