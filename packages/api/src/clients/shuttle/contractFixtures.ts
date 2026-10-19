// Type-checks the shared fixtures against the contract types (SH-7a "done when").
// Not a runtime module to import — its only job is to fail `tsc` if the
// fixtures and the types in ./contract drift apart. Mirrors
// mixtape-release-core/app/shuttle/tests/test_contract.py, which checks the
// same fixtures against the JSON Schemas on the core side.

import weaveInFixture from "./fixtures/three_choirs_weave_in.json"
import packetOutFixture from "./fixtures/three_choirs_packet_out.json"
import confirmInFixture from "./fixtures/three_choirs_confirm_in.json"
import resultOutFixture from "./fixtures/three_choirs_result_out.json"

import type {
  ShuttleWeaveIn,
  ShuttlePacketOut,
  ShuttleConfirmIn,
  ShuttleResultOut,
} from "./contract"

export const weaveIn = weaveInFixture satisfies ShuttleWeaveIn
export const packetOut = packetOutFixture satisfies ShuttlePacketOut
export const confirmIn = confirmInFixture satisfies ShuttleConfirmIn
export const resultOut = resultOutFixture satisfies ShuttleResultOut
