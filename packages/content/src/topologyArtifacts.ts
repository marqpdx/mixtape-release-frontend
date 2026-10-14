/** Trusted public HTML artifacts available to article authors and readers. */
export const topologyArtifacts = [
  {
    id: 'system',
    title: 'Mixtape — System Topology',
    imageUrl: 'https://www.crossroads.place/artifacts/system/system-topology.png',
    htmlUrl: 'https://www.crossroads.place/artifacts/system/system-topology.html',
  },
  {
    id: 'loom',
    title: 'Loom — Internal Architecture',
    imageUrl: 'https://www.crossroads.place/artifacts/loom/loom-topology-enhanced.png',
    htmlUrl: 'https://www.crossroads.place/artifacts/loom/loom-topology-enhanced.html',
  },
] as const

export type TopologyArtifact = (typeof topologyArtifacts)[number]

export function getTopologyArtifact(id: unknown): TopologyArtifact | undefined {
  return topologyArtifacts.find(artifact => artifact.id === id)
}
