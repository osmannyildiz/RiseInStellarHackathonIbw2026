# Privacy Reference

ClawLoan's privacy feature must be cryptographic. Hiding fields in the UI is not privacy because public contract state, events, RPC reads, and indexers can expose the same data.

## Claim

Use this wording:

```text
ClawLoan uses a ZK eligibility proof so a borrower can prove it satisfies a lender policy without revealing the private reputation witness behind that eligibility.
```

Do not claim fully private payments, hidden counterparties, hidden token movements, or privacy from UI suppression.

## Eligibility Proof

The borrower may include an `EligibilityProof` reference:

```rust
pub struct EligibilityProof {
    pub proof_hash: BytesN<32>,
    pub public_inputs_hash: BytesN<32>,
    pub reputation_root: BytesN<32>,
    pub nullifier_hash: BytesN<32>,
    pub verifier: Address,
    pub expires_at: u64,
}
```

The proof statement should show:

```text
I know private reputation records committed under reputation_root,
and for this Loan Request:
- score >= required_score;
- credit_limit >= requested_amount;
- defaults <= max_defaults;
- nullifier_hash is bound to this request and nonce;
- expires_at has not passed.
```

## Verification Rules

For the privacy run:

- set `min_reputation_score = 50`;
- set `require_eligibility_proof = true`;
- reject expired proofs;
- reject reused nullifiers;
- reject proofs not bound to borrower, request, amount, purpose hash, and public inputs;
- reject demo proof envelopes unless the operator explicitly enables a non-private demo bypass;
- prefer a Groth16/BLS12-381 verifier receipt using Stellar/Soroban cryptographic primitives.

If proof verification fails, regenerate the proof for the current request id and nonce. Do not bypass proof verification for the privacy track run.
