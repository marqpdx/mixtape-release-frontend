// src/components/editor/extensions/BlockRouting.ts

import { Extension } from "@tiptap/core"

type Destination =
  | { kind: "post"; id?: string }
  | { kind: "article"; id?: string }
  | { kind: "dispatch"; id?: string; path?: string }

export type RouteMeta = { destinations: Destination[] }

export interface BlockRoutingOptions {
  getRouteMeta: (blockId: string) => RouteMeta | undefined
  setRouteMeta: (blockId: string, meta: RouteMeta) => void
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockRouting: {
      setBlockDestinations: (blockId: string, dests: Destination[]) => ReturnType
      appendBlockDestination: (blockId: string, dest: Destination) => ReturnType
    }
  }
}

export const BlockRouting = Extension.create<BlockRoutingOptions>({
  name: "blockRouting",
  addOptions() {
    return {
      getRouteMeta: () => undefined,
      setRouteMeta: () => {},
    }
  },
  addCommands() {
    return {
      setBlockDestinations:
        (blockId, destinations) =>
        () => {
          const prev = this.options.getRouteMeta(blockId) ?? { destinations: [] }
          this.options.setRouteMeta(blockId, { ...prev, destinations })
          return true
        },
      appendBlockDestination:
        (blockId, dest) =>
        () => {
          const prev = this.options.getRouteMeta(blockId) ?? { destinations: [] }
          this.options.setRouteMeta(blockId, { destinations: [...prev.destinations, dest] })
          return true
        },
    }
  },
})
