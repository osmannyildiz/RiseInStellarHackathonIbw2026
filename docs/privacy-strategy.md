# Privacy Strategy

The recommended privacy focus is selective reputation eligibility. It directly supports the trust mechanism: a borrower should be able to prove it is eligible for a loan without exposing its full repayment history, counterparties, prior loan amounts, or strategy.

This is stronger than a generic "private intent" story because it answers a real lender question: can this borrower be trusted enough for this request?

## Privacy Claim

For the hackathon MVP, the product should claim:

> Agent Lending Network lets a borrower disclose only the reputation facts needed for a lending decision, while keeping unnecessary repayment-history detail private.

The product should not claim that all lending activity is fully private. Soroban contract storage and token transfers are public unless a dedicated privacy mechanism is used.

## What Is Hidden

The selective reputation flow aims to hide:

- full repayment history;
- previous counterparties;
- exact prior loan amounts;
- detailed default/late-payment timeline;
- private request purpose text.

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

Use a two-level privacy plan.

### Level 1: Proof Reference Or Signed Attestation

This is the pragmatic hackathon path.

1. Reputation is derived from onchain repayment events.
2. A reputation service, script, or agent computes private eligibility facts.
3. The borrower includes a `ReputationProofRef` or signed eligibility attestation with the lending request.
4. The lender skill verifies that the proof reference or attestation satisfies its policy.
5. The contract stores only the proof reference and public request state.

This is not full ZK, but it demonstrates selective disclosure cleanly: the lender gets the eligibility fact, not the full history.

### Level 2: Onchain ZK Verifier If Time Allows

If implementation time allows, add a verifier contract or verifier module. The proof statement should be narrow:

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

This means an onchain ZK path may be plausible, but it should not be assumed until the project verifies local tooling, deployed network support, and the proving system.

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
3. Borrower does not reveal full repayment history.
4. Borrower provides an eligibility proof reference.
5. Lender skill verifies the reference and funds the request.
6. Landing page explains that the full history was not exposed.

This gives the Privacy track a concrete story tied to the lending product, without overclaiming full confidential payments.

## Open Privacy Decisions

- Should the MVP use signed attestations only, or attempt an onchain verifier?
- Who issues the eligibility attestation in the demo: an indexer script, contract-derived root, or a dedicated reputation agent?
- Should private request purpose be shown as a hash-only commitment, or should the lender receive purpose text offchain?
- How much proof detail should the landing page expose to be credible without confusing judges?
