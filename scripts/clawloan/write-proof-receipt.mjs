#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [proofPath, publicPath, verificationKeyPath, outputPath] = process.argv.slice(2);

if (!proofPath || !publicPath || !verificationKeyPath || !outputPath) {
  console.error("Usage: write-proof-receipt.mjs <proof.json> <public.json> <verification_key.json> <output.json>");
  process.exit(1);
}

const proof = JSON.parse(await readFile(proofPath, "utf8"));
const publicSignals = JSON.parse(await readFile(publicPath, "utf8"));
const verificationKey = JSON.parse(await readFile(verificationKeyPath, "utf8"));

const receipt = {
  schema: "clawloan/groth16-eligibility-receipt/v1",
  method: "groth16-bls12-381",
  status: "verified",
  proofHash: hashJson(proof),
  publicInputsHash: hashJson(publicSignals),
  verificationKeyHash: hashJson(verificationKey),
  publicSignals,
  generatedAt: Math.floor(Date.now() / 1000),
  files: {
    proof: proofPath,
    public: publicPath,
    verificationKey: verificationKeyPath,
  },
};

await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
