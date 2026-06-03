# AGENTS.md

- If `stellar contract build` fails because it cannot find `core` for `wasm32v1-none` even after `rustup target add wasm32v1-none`, rerun it with the rustup toolchain first in PATH: `PATH=/Users/osman/.cargo/bin:$PATH stellar contract build`.
- Avoid large god files in any project. Modularize by responsibility early, following the language/framework conventions or conventions already used in that project.
