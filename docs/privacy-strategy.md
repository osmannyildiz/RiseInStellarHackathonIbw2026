# Privacy Strategy

ClawLoan's privacy track must be cryptographic. Hiding fields in the UI is not privacy, because public contract state, events, RPC reads, indexers, and block explorers can still expose the same data.

The revised privacy focus is a zero-knowledge Eligibility Proof: the borrower proves that private reputation facts satisfy a lender policy without revealing the underlying repayment records. The proof is bound to one Loan Request through public inputs and a nullifier, then verified with Stellar/Soroban cryptographic primitives.

## Privacy Claim

Use this wording:

```text
ClawLoan uses a ZK eligibility proof so a borrower can prove it satisfies a lender policy without revealing the private reputation witness behind that eligibility.
```

Do not claim privacy from UI hiding. Also do not claim fully private settlement in the MVP unless the project adds confidential payment mechanics. Borrower and lender addresses, token movement, and contract events remain public in the current lending lifecycle.

## Cryptographic Primitive Path

The committed privacy path is:

1. The borrower keeps a private reputation witness offchain.
2. The borrower commits to that witness with a reputation root.
3. The borrower generates a Groth16 proof over BLS12-381-compatible public inputs.
4. Public inputs include request id, requested amount, policy thresholds, purpose commitment, reputation root, nullifier hash, verifier id, and expiry.
5. A verifier contract or helper verifies the proof against the verifying key using Soroban-supported cryptographic primitives.
6. The lending flow accepts the request only if the proof verifies and the nullifier has not been used.

Stellar Protocol 22 introduced BLS12-381 host functions through CAP-0059, and the current `soroban-sdk` exposes crypto functions including SHA-256, signature verification, and BLS12-381 access through `env.crypto()`. The project should use the official Groth16 verifier example as the verifier starting point instead of inventing pairing logic.

## Proof Statement

The proof should express a narrow policy statement:

```text
I know private reputation records committed under reputation_root, and for this Loan Request:
- reputation score >= required_score;
- current credit limit >= requested_amount;
- default count <= max_defaults;
- purpose text opens to purpose_hash if a purpose witness is included;
- nullifier_hash is derived from borrower secret, request id, and nonce;
- expires_at has not passed.
```

Public inputs:

- verifier id;
- borrower address or borrower commitment, depending on the final circuit;
- loan request id;
- requested amount;
- minimum score;
- maximum defaults;
- purpose hash;
- reputation root;
- nullifier hash;
- proof expiration.

Private witness:

- full repayment records;
- exact prior loan amounts;
- exact repayment timing;
- score calculation inputs;
- credit-limit calculation inputs;
- default count source records;
- purpose preimage when proving purpose binding.

## What Is Private

Only data inside the ZK witness is private:

- repayment-history records used to compute the reputation root;
- exact prior loan amounts if they are not otherwise published in public loan state;
- exact repayment timing if it is not otherwise published in public events;
- private purpose text when only its commitment is public;
- scoring inputs not emitted elsewhere.

If any of those values are already stored in public contract state or emitted in public events, the proof cannot make them private retroactively. The data model must avoid publishing private witness values in the first place.

## What Remains Public

The MVP still exposes:

- public borrower and lender addresses when stored on Loan Requests and Loans;
- public XLM/SAC transfers;
- Loan Request amount and fee model unless a later confidential amount design is added;
- contract events and public state;
- proof public inputs;
- the fact that a proof was submitted and accepted;
- verifier contract identity and nullifier hash.

## Data Model Mapping

The privacy object is an Eligibility Proof reference, not an attestation:

```rust
pub enum PrivacyProof {
    None,
    Present(EligibilityProof),
}

pub struct EligibilityProof {
    pub proof_hash: BytesN<32>,
    pub public_inputs_hash: BytesN<32>,
    pub reputation_root: BytesN<32>,
    pub nullifier_hash: BytesN<32>,
    pub verifier: Address,
    pub expires_at: u64,
}
```

The contract must reject missing proofs when `PrivacyMode.require_proof = true`, reject expired proofs, and reject reused nullifiers. A complete verifier integration must additionally call a Groth16/BLS12-381 verifier contract before funding.

## Demo Path

The honest demo path is:

1. Borrower creates a proof envelope with public inputs and a nullifier.
2. If no Groth16 proof/verifier receipt is available, the helper labels it a demo envelope and the lender heartbeat rejects it by default.
3. For a real privacy run, the proof envelope must include a verifier receipt from a Groth16/BLS12-381 verifier.
4. The lender heartbeat checks public-input binding, expiry, nullifier replay status, and verifier receipt before funding.
5. The landing page explains that privacy comes from the verified proof and public-input design, not from hiding fields in the UI.

## Implementation Notes

- Use SHA-256 or circuit-compatible hashes for commitments only where the circuit and verifier agree.
- Keep verifier, policy, and lending state transition separate.
- Add negative tests for expired proofs, nullifier replay, tampered public inputs, wrong verifier id, and missing verifier receipt.
- Document the exact circuit, proving toolchain, verifying key, and supported Stellar protocol version before claiming production privacy.
- Treat BN254/Poseidon paths as capability-gated unless the target network and SDK support are verified.

## Sources Checked

- Stellar Protocol Upgrades: Protocol 22 added CAP-0059 BLS12-381 host functions.
- CAP-0059: BLS12-381 host functions are final and define host functions for pairing-friendly curve operations.
- Stellar Soroban Groth16 verifier example: use this as the verifier implementation starting point.
