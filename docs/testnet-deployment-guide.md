# Going Live on Testnet — Phase 6 Guide

> **Goal**: Build, deploy, and run the full ClawLoan loan lifecycle on Stellar testnet.

---

## Prerequisites Check

```bash
# Verify tools are installed
stellar --version          # need stellar CLI ≥ 26
rustup target list --installed | grep wasm32v1-none   # need wasm32v1-none

# If wasm target is missing:
rustup target add wasm32v1-none
```

You already have three keys configured: `alice`, `bob`, `charlie`.

| Role     | Key name  | Purpose             |
| -------- | --------- | ------------------- |
| Admin    | `alice`   | Deploys contract    |
| Borrower | `bob`     | Posts loan requests |
| Lender   | `charlie` | Funds loans         |

---

## Step 1 — Fund Testnet Accounts

```bash
# Fund each account via Friendbot (free testnet XLM)
stellar keys fund alice --network testnet
stellar keys fund bob --network testnet
stellar keys fund charlie --network testnet
```

```bash
# Verify balances (bob needs >12 XLM, charlie needs >25 XLM)
stellar keys address alice
stellar keys address bob
stellar keys address charlie
# Check balances on https://stellar.expert or:
curl -s "https://horizon-testnet.stellar.org/accounts/$(stellar keys address bob)" | jq '.balances[] | select(.asset_type=="native") | .balance'
curl -s "https://horizon-testnet.stellar.org/accounts/$(stellar keys address charlie)" | jq '.balances[] | select(.asset_type=="native") | .balance'
```

---

## Step 2 — Build the Contract

```bash
cd soroban-contract

# Build (use rustup toolchain path if wasm32v1-none errors)
PATH=/Users/osman/.cargo/bin:$PATH stellar contract build
```

The WASM will land at:

```
target/wasm32v1-none/release/hello_world.wasm
```

---

## Step 3 — Deploy to Testnet

Deploy with constructor args:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source alice \
  --network testnet \
  -- \
  --config '{"admin":"'$(stellar keys address alice)'","xlm_token":"'$(stellar contract id asset --asset native --network testnet)'","min_request_amount":"10000000","max_request_amount":"100000000","default_starting_credit_limit":"200000000","late_threshold_seconds":45,"reputation_success_increment":10,"reputation_late_penalty":5,"reputation_default_penalty":20}'
```

> [!IMPORTANT]
> XLM amounts are in **stroops** (1 XLM = 10,000,000 stroops).
>
> - `10 XLM` = `100000000`
> - `20 XLM` = `200000000`
> - `1 XLM` = `10000000`

Save the returned **contract ID** — it's needed for every subsequent command.

```bash
# Store it in a variable for this session:
export CONTRACT_ID="C..."   # paste the deployed contract ID
```

---

## Step 4 — Register Agents

```bash
# Register bob as Borrower
stellar contract invoke \
  --id $CONTRACT_ID \
  --source bob \
  --network testnet \
  -- \
  register_agent \
  --agent $(stellar keys address bob) \
  --display_name "BorrowerBot" \
  --role Borrower \
  --public_metadata_hash 0000000000000000000000000000000000000000000000000000000000000000

# Register charlie as Lender
stellar contract invoke \
  --id $CONTRACT_ID \
  --source charlie \
  --network testnet \
  -- \
  register_agent \
  --agent $(stellar keys address charlie) \
  --display_name "LenderBot" \
  --role Lender \
  --public_metadata_hash 0000000000000000000000000000000000000000000000000000000000000000
```

---

## Step 5 — Set Lender Policy

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source charlie \
  --network testnet \
  -- \
  set_lender_policy \
  --lender $(stellar keys address charlie) \
  --policy '{"lender":"'$(stellar keys address charlie)'","enabled":true,"max_single_loan_amount":"100000000","max_total_exposure":"200000000","min_reputation_score":0,"min_fee_bps":100,"max_duration_seconds":0,"allow_repeat_borrower":true}'
```

> [!TIP]
> `min_reputation_score: 0` lets a fresh borrower through on the first run.

---

## Step 6 — Post a Loan Request (Borrower)

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source bob \
  --network testnet \
  -- \
  post_loan_request \
  --borrower $(stellar keys address bob) \
  --amount 100000000 \
  --fee_model '{"base_fee_bps":200,"step_fee_bps":100,"step_seconds":15,"max_fee_bps":500}' \
  --purpose_hash 0000000000000000000000000000000000000000000000000000000000000001 \
  --privacy_mode '{"hide_purpose":true,"require_proof":false}' \
  --eligibility_proof None
```

> Save the returned **loan_request_id** (should be `1` on a fresh contract).

---

## Step 7 — Fund the Loan (Lender)

```bash
# Check open requests first
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  list_open_loan_request_ids

# Fund request #1
stellar contract invoke \
  --id $CONTRACT_ID \
  --source charlie \
  --network testnet \
  -- \
  fund_loan_request \
  --lender $(stellar keys address charlie) \
  --loan_request_id 1
```

> Save the returned **loan_id** (should be `1`).

---

## Step 8 — Check Amount Due

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  current_amount_due \
  --loan_id 1
```

> The amount grows over time. At 0s it's `10.02 XLM` (200 bps base fee). After 15s it becomes `10.03 XLM`, etc.

---

## Step 9 — Repay the Loan (Borrower)

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source bob \
  --network testnet \
  -- \
  repay_loan \
  --borrower $(stellar keys address bob) \
  --loan_id 1
```

---

## Step 10 — Verify On-Chain State

```bash
# Network stats
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  get_network_stats

# Borrower reputation (should show score > 50, 1 successful repayment)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  get_reputation \
  --agent $(stellar keys address bob)

# Confirm no active loans remain
stellar contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  list_active_loan_ids
```

---

## Quick Recovery Commands

```bash
# List stale open requests
stellar contract invoke --id $CONTRACT_ID --source alice --network testnet -- list_open_loan_request_ids

# Cancel a stale request
stellar contract invoke --id $CONTRACT_ID --source bob --network testnet -- cancel_loan_request \
  --borrower $(stellar keys address bob) --loan_request_id <ID>

# Mark a loan defaulted (admin only, after 45s)
stellar contract invoke --id $CONTRACT_ID --source alice --network testnet -- mark_defaulted \
  --admin $(stellar keys address alice) --loan_id <ID>

# Re-fund an account
stellar keys fund bob --network testnet

# Redeploy a fresh contract (repeat Step 3)
```

---

## Privacy Run Add-On (After Happy Path Works)

```bash
# 1. Update lender policy to require proof + min reputation 50
stellar contract invoke \
  --id $CONTRACT_ID \
  --source charlie \
  --network testnet \
  -- \
  set_lender_policy \
  --lender $(stellar keys address charlie) \
  --policy '{"lender":"'$(stellar keys address charlie)'","enabled":true,"max_single_loan_amount":"100000000","max_total_exposure":"200000000","min_reputation_score":50,"min_fee_bps":100,"max_duration_seconds":0,"allow_repeat_borrower":true}'

# 2. Generate eligibility proof (local helper)
cd scripts/clawloan
./generate-eligibility-proof

# 3. Post request with require_proof: true and the proof envelope
#    (use proof values from the generated receipt)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source bob \
  --network testnet \
  -- \
  post_loan_request \
  --borrower $(stellar keys address bob) \
  --amount 100000000 \
  --fee_model '{"base_fee_bps":200,"step_fee_bps":100,"step_seconds":15,"max_fee_bps":500}' \
  --purpose_hash 0000000000000000000000000000000000000000000000000000000000000002 \
  --privacy_mode '{"hide_purpose":true,"require_proof":true}' \
  --eligibility_proof '{"Present":{"proof_hash":"<FROM_RECEIPT>","public_inputs_hash":"<FROM_RECEIPT>","reputation_root":"<FROM_RECEIPT>","nullifier_hash":"<FROM_RECEIPT>","verifier":"'$(stellar keys address alice)'","expires_at":99999999999}}'

# 4. Fund it (lender heartbeat checks proof before funding)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source charlie \
  --network testnet \
  -- \
  fund_loan_request \
  --lender $(stellar keys address charlie) \
  --loan_request_id 2
```

---

## Connect Frontend

After deploying, update the frontend environment with the contract ID and network:

```bash
# Create a .env file or update the existing config in frontend/
echo "VITE_CONTRACT_ID=$CONTRACT_ID" > frontend/.env.local
echo "VITE_NETWORK=testnet" >> frontend/.env.local
echo "VITE_RPC_URL=https://soroban-testnet.stellar.org" >> frontend/.env.local

# Start the dev server
cd frontend && pnpm dev
```

---

## Phase 6 Completion Checklist

- [ ] Contract builds with `stellar contract build`
- [ ] Contract deployed to testnet with valid contract ID
- [ ] Both agents registered and lender policy set
- [ ] Loan request posted, funded, and repaid on testnet
- [ ] `get_network_stats` shows `loans_funded=1`, `loans_repaid=1`
- [ ] Borrower reputation score increased from 50
- [ ] Frontend can read contract ID from env and display stats
- [ ] Recovery commands work (cancel, re-fund, redeploy)
