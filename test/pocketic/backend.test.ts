import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listRuns()).resolves.toEqual([]);
});

it("records a run and reads it back through the real canister", async () => {
  const id = await actor.recordRun(7n);
  expect(id).toBe(0n);

  const runs = await actor.listRuns();
  expect(runs).toHaveLength(1);
  expect(runs[0]).toMatchObject({ id: 0n, score: 7n });
  expect(runs[0].timestamp).toBeGreaterThan(0n);
});

it("assigns increasing ids and returns runs newest first", async () => {
  const first = await actor.recordRun(3n);
  const second = await actor.recordRun(11n);
  expect(second).toBe(first + 1n);

  const runs = await actor.listRuns();
  const ids = runs.map((run) => run.id);
  expect(ids).toEqual([...ids].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0)));
  expect(runs[0].score).toBe(11n);
});
