# ClawLoan Eligibility Proof Demo

This folder contains the real ZK proof demo for ClawLoan's privacy track.

The circuit proves, with private witness values:

- `score >= minScore`
- `creditLimit >= requestedAmount`
- `defaults <= maxDefaults`
- the private witness is bound to public `reputationRoot`
- the proof is bound to a public `nullifierHash`

Circuit public signals are `minScore`, `requestedAmount`, `maxDefaults`, `requestId`, `reputationRoot`, and `nullifierHash`. The ClawLoan runtime envelope also binds borrower address, purpose hash, verifier id, and expiry around the receipt. Production hardening should move every semantically critical binding into the audited verifier statement.

The demo witness in `input.json` keeps `score`, `creditLimit`, `defaults`, repayment-history inputs, and `salt` private. Public outputs are written to `public.json` after proof generation.

Important limitation: the in-circuit commitment is demo-grade arithmetic, not production-grade Poseidon/Pedersen. It is enough to demonstrate real ZK privacy for the private witness values in a hackathon demo, but production reputation credentials should replace it with a circuit-native cryptographic commitment and audited verifier setup.

Generate artifacts:

```bash
./scripts/clawloan/generate-eligibility-proof
```

Expected generated files:

- `build/eligibility.r1cs`
- `build/eligibility_js/eligibility.wasm`
- `build/eligibility_final.zkey`
- `build/verification_key.json`
- `build/proof.json`
- `build/public.json`
- `build/proof-receipt.json`

The local ClawLoan helper reads `proof-receipt.json` for the privacy run.
