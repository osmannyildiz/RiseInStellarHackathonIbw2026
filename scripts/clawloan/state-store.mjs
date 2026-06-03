import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_STATE_PATH } from "./constants.mjs";
import { createDefaultState } from "./demo-state.mjs";

export async function loadState(statePath = DEFAULT_STATE_PATH) {
  try {
    const raw = await readFile(statePath, "utf8");
    const state = JSON.parse(raw);
    state.statePath = statePath;
    return state;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    const state = createDefaultState();
    state.statePath = statePath;
    return state;
  }
}

export async function saveState(state, statePath = state.statePath || DEFAULT_STATE_PATH) {
  await mkdir(path.dirname(statePath), { recursive: true });
  state.generatedAt = Math.floor(Date.now() / 1000);
  state.statePath = statePath;
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

