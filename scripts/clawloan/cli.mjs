#!/usr/bin/env node
import { setTimeout as sleep } from "node:timers/promises";
import {
  postDemoLoanRequest,
  repayDemoLoan,
  runBorrowerHeartbeatOnce,
  runLenderHeartbeatOnce,
} from "./actions.mjs";
import {
  formatBorrowerHeartbeat,
  formatLenderHeartbeat,
  formatPostRequest,
  formatRecovery,
  formatRepayment,
} from "./format.mjs";
import { loadState, saveState } from "./state-store.mjs";

const command = process.argv[2] || "help";
const args = parseArgs(process.argv.slice(3));

try {
  await main(command, args);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function main(commandName, options) {
  if (commandName === "help" || commandName === "--help") {
    printHelp();
    return;
  }

  const state = await loadState(options.state);
  let output;
  let shouldSave = false;

  switch (commandName) {
    case "post-demo-loan-request": {
      const result = postDemoLoanRequest(state, options);
      output = formatPostRequest(result);
      shouldSave = result.ok && !options.dryRun;
      break;
    }
    case "run-lender-heartbeat-once": {
      const result = runLenderHeartbeatOnce(state, options);
      output = formatLenderHeartbeat(result);
      shouldSave = result.funded && !options.dryRun;
      break;
    }
    case "run-lender-heartbeat-loop": {
      await runLoop({
        state,
        options,
        runOnce: runLenderHeartbeatOnce,
        format: formatLenderHeartbeat,
        mutates: (result) => result.funded,
      });
      return;
    }
    case "run-borrower-heartbeat-once": {
      const result = runBorrowerHeartbeatOnce(state, options);
      output = formatBorrowerHeartbeat(result);
      shouldSave = result.action === "post_request" && !options.dryRun;
      break;
    }
    case "run-borrower-heartbeat-loop": {
      await runLoop({
        state,
        options,
        runOnce: runBorrowerHeartbeatOnce,
        format: formatBorrowerHeartbeat,
        mutates: (result) => result.action === "post_request",
      });
      return;
    }
    case "repay-demo-loan": {
      const result = repayDemoLoan(state, options);
      output = formatRepayment(result);
      shouldSave = result.ok && !options.dryRun;
      break;
    }
    case "recover-demo": {
      output = formatRecovery(state);
      break;
    }
    default:
      throw new Error(`Unknown command: ${commandName}`);
  }

  if (shouldSave) {
    await saveState(state, options.state);
  }
  console.log(output);
}

async function runLoop({ state, options, runOnce, format, mutates }) {
  const intervalMs = Number(options.intervalMs || 15_000);
  const count = Number(options.count || 0);
  let iteration = 0;

  while (count === 0 || iteration < count) {
    iteration += 1;
    const result = runOnce(state, options);
    if (mutates(result) && !options.dryRun) {
      await saveState(state, options.state);
    }
    console.log(`\nHeartbeat loop iteration ${iteration}`);
    console.log(format(result));
    if (count !== 0 && iteration >= count) {
      break;
    }
    await sleep(intervalMs);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = toCamelCase(arg.slice(2));
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = coerceValue(next);
      index += 1;
    }
  }
  return parsed;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function coerceValue(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && value.trim() !== "" ? numeric : value;
}

function printHelp() {
  console.log(`ClawLoan heartbeat CLI

Commands:
  post-demo-loan-request
  run-lender-heartbeat-once
  run-lender-heartbeat-loop --interval-ms 15000 --count 0
  run-borrower-heartbeat-once
  run-borrower-heartbeat-loop --interval-ms 15000 --count 0
  repay-demo-loan
  recover-demo

Options:
  --state <path>       JSON state path. Defaults to generated/clawloan-demo-state.json.
  --dry-run           Print the heartbeat decision without saving state.
  --privacy-run       Post a request that requires a cryptographic Eligibility Proof.
  --require-eligibility-proof
                      Require and attach a verified proof receipt, unless the demo bypass is enabled.
  --allow-demo-proof-envelope
                      Let local heartbeat accept a non-ZK demo proof envelope.
  --proof-receipt <path>
                      Verified Groth16/BLS12-381 receipt path. Defaults to zk/eligibility/build/proof-receipt.json.
  --proof-ttl-seconds <n>
                      Proof validity window. Defaults to 300.
  --count <n>         Loop iteration count. 0 means run until stopped.
  --interval-ms <n>   Delay between loop iterations.
`);
}
