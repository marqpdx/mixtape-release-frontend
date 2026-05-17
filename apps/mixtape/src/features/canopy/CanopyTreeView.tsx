'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Box, Flex, Text, Badge, IconButton } from '@chakra-ui/react';
import {
  IconRefresh, IconZoomIn, IconZoomOut,
  IconArrowRight, IconArrowDown, IconCircleDot,
  IconLayoutBoard,
} from '@tabler/icons-react';

// ─── Shared Codex visual language (mirrors reference/loom/codex.md) ───────────

type VerbFamily   = 'outcome' | 'process' | 'governance' | 'inquiry' | 'substrate';
type PulseProfile = 'steady' | 'considered' | 'rapid' | 'ambient' | 'stalled';

const FAMILY_COLORS: Record<VerbFamily | string, string> = {
  outcome:    '#4299e1',
  process:    '#9f7aea',
  governance: '#f6c90e',
  inquiry:    'rgba(255,255,255,0.5)',
  substrate:  '#2d6a4f',
  mixed:      '#52b788',
};

const PULSE_PERIODS: Record<PulseProfile, number> = {
  steady:     2500,
  considered: 1800,
  rapid:      700,
  ambient:    4000,
  stalled:    6000,
};

// ─── Shared LoomEncoded interface ─────────────────────────────────────────────
// Parallel to Op in Vantage — same encoding fields, different temporal register

interface SatelliteConfig {
  top?: 'context';
  right?: 'tier';
  bottom?: 'provenance';
  left?: 'persona';
  topRight?: 'privacy';
}

interface LoomEncoded {
  color: string;
  pulseProfile: PulseProfile;
  satellites: SatelliteConfig;
  dominantFamily: VerbFamily | 'mixed';
  tier: 'local' | 'cloud' | 'mixed';
}

// ─── Canopy Node ──────────────────────────────────────────────────────────────

type ContextType = 'root' | 'personal' | 'group' | 'initiative' | 'sub-initiative';

interface CanopyNodeData extends LoomEncoded {
  id: string;
  name: string;
  contextType: ContextType;
  children?: CanopyNodeData[];

  // Structural signals
  irDensity: number;        // 0–1 accumulated IR richness
  activityRecency: number;  // days since last op (lower = more recent)
  opCount: number;
  personaCount: number;
  contextHealth: number;    // 0–1 GroupContext richness
  verbDistribution: Partial<Record<string, number>>;
  hasPrivacy: boolean;
  description?: string;
}

// ─── Mock data tree ───────────────────────────────────────────────────────────

const MOCK_TREE: CanopyNodeData = {
  id: 'root', name: 'Workspace', contextType: 'root',
  color: '#52b788', dominantFamily: 'mixed', tier: 'local',
  pulseProfile: 'steady', irDensity: 0.72, activityRecency: 0,
  opCount: 3847, personaCount: 12, contextHealth: 0.81, hasPrivacy: false,
  satellites: { top:'context', bottom:'provenance' },
  verbDistribution: { draft:420, retrieve:1100, synthesize:88, classify:940, pattern:210 },
  children: [
    {
      id:'personal', name:'Personal', contextType:'personal',
      color:'#68d391', dominantFamily:'process', tier:'local',
      pulseProfile:'ambient', irDensity:0.41, activityRecency:3,
      opCount:284, personaCount:2, contextHealth:0.55, hasPrivacy:true,
      satellites:{ top:'context', bottom:'provenance', topRight:'privacy' },
      verbDistribution:{ draft:60, retrieve:140, classify:84 },
      description:'Personal workspace and writing projects',
      children:[
        {
          id:'p-writing', name:'Content Series', contextType:'initiative',
          color:'#4299e1', dominantFamily:'outcome', tier:'local',
          pulseProfile:'considered', irDensity:0.68, activityRecency:1,
          opCount:142, personaCount:1, contextHealth:0.72, hasPrivacy:false,
          satellites:{ top:'context', bottom:'provenance', left:'persona' },
          verbDistribution:{ draft:88, refine:32, retrieve:22 },
          description:'25-article series on human-AI collaboration',
          children:[
            {
              id:'p-w-lead', name:'Lead Article', contextType:'sub-initiative',
              color:'#4299e1', dominantFamily:'outcome', tier:'local',
              pulseProfile:'steady', irDensity:0.82, activityRecency:0,
              opCount:67, personaCount:1, contextHealth:0.88, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance', left:'persona' },
              verbDistribution:{ draft:44, refine:18, retrieve:5 },
              description:'Personal grounding piece — lead article',
            },
            {
              id:'p-w-collab', name:'Collaboration Patterns', contextType:'sub-initiative',
              color:'#2d9cdb', dominantFamily:'outcome', tier:'local',
              pulseProfile:'ambient', irDensity:0.44, activityRecency:8,
              opCount:32, personaCount:1, contextHealth:0.61, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance', left:'persona' },
              verbDistribution:{ draft:20, retrieve:12 },
            },
          ],
        },
        {
          id:'p-research', name:'Research', contextType:'initiative',
          color:'#9f7aea', dominantFamily:'process', tier:'mixed',
          pulseProfile:'ambient', irDensity:0.28, activityRecency:14,
          opCount:88, personaCount:0, contextHealth:0.32, hasPrivacy:false,
          satellites:{ top:'context', right:'tier', bottom:'provenance' },
          verbDistribution:{ retrieve:55, pattern:18, synthesize:15 },
        },
      ],
    },
    {
      id:'group-a', name:'Mixtape', contextType:'group',
      color:'#52b788', dominantFamily:'mixed', tier:'mixed',
      pulseProfile:'steady', irDensity:0.78, activityRecency:0,
      opCount:2840, personaCount:8, contextHealth:0.88, hasPrivacy:false,
      satellites:{ top:'context', right:'tier', bottom:'provenance', left:'persona' },
      verbDistribution:{ draft:280, retrieve:820, synthesize:62, classify:740, pattern:180, context_shape:440 },
      description:'Main platform development context',
      children:[
        {
          id:'ma-loom', name:'Loom / Vantage', contextType:'initiative',
          color:'#4299e1', dominantFamily:'outcome', tier:'mixed',
          pulseProfile:'rapid', irDensity:0.88, activityRecency:0,
          opCount:621, personaCount:3, contextHealth:0.92, hasPrivacy:false,
          satellites:{ top:'context', right:'tier', bottom:'provenance', left:'persona' },
          verbDistribution:{ draft:180, synthesize:28, retrieve:240, context_shape:120, pattern:53 },
          description:'Intelligence membrane and observability surface',
          children:[
            {
              id:'ma-l-codex', name:'Codex', contextType:'sub-initiative',
              color:'#2d9cdb', dominantFamily:'substrate', tier:'local',
              pulseProfile:'considered', irDensity:0.91, activityRecency:0,
              opCount:88, personaCount:1, contextHealth:0.95, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance' },
              verbDistribution:{ context_shape:44, retrieve:32, pattern:12 },
              description:'Semantic vocabulary and visual language governance',
            },
            {
              id:'ma-l-vantage', name:'Vantage Canvas', contextType:'sub-initiative',
              color:'#4299e1', dominantFamily:'outcome', tier:'local',
              pulseProfile:'steady', irDensity:0.74, activityRecency:1,
              opCount:142, personaCount:2, contextHealth:0.82, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance', left:'persona' },
              verbDistribution:{ draft:88, refine:34, retrieve:20 },
            },
            {
              id:'ma-l-canopy', name:'Canopy', contextType:'sub-initiative',
              color:'#52b788', dominantFamily:'process', tier:'local',
              pulseProfile:'considered', irDensity:0.31, activityRecency:0,
              opCount:12, personaCount:0, contextHealth:0.44, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance' },
              verbDistribution:{ context_shape:8, retrieve:4 },
              description:'Structural initiative browser — this surface',
            },
          ],
        },
        {
          id:'ma-aperture', name:'Aperture', contextType:'initiative',
          color:'#9f7aea', dominantFamily:'process', tier:'local',
          pulseProfile:'steady', irDensity:0.71, activityRecency:2,
          opCount:488, personaCount:4, contextHealth:0.79, hasPrivacy:false,
          satellites:{ top:'context', bottom:'provenance', left:'persona' },
          verbDistribution:{ retrieve:280, classify:140, pattern:68 },
          description:'Memory and continuity platform',
          children:[
            {
              id:'ma-ap-worktable', name:'WorkTable', contextType:'sub-initiative',
              color:'#805ad5', dominantFamily:'process', tier:'local',
              pulseProfile:'ambient', irDensity:0.55, activityRecency:4,
              opCount:122, personaCount:2, contextHealth:0.68, hasPrivacy:false,
              satellites:{ top:'context', bottom:'provenance', left:'persona' },
              verbDistribution:{ retrieve:80, classify:42 },
            },
          ],
        },
        {
          id:'ma-earthlab', name:'EarthLab', contextType:'initiative',
          color:'#68d391', dominantFamily:'mixed', tier:'local',
          pulseProfile:'ambient', irDensity:0.52, activityRecency:7,
          opCount:340, personaCount:3, contextHealth:0.64, hasPrivacy:false,
          satellites:{ top:'context', bottom:'provenance', left:'persona' },
          verbDistribution:{ draft:120, retrieve:140, summarize:80 },
          description:'Learning management system',
        },
        {
          id:'ma-enterprise', name:'Enterprise Onboarding', contextType:'initiative',
          color:'#f6c90e', dominantFamily:'governance', tier:'local',
          pulseProfile:'considered', irDensity:0.44, activityRecency:2,
          opCount:180, personaCount:2, contextHealth:0.58, hasPrivacy:false,
          satellites:{ top:'context', bottom:'provenance', left:'persona' },
          verbDistribution:{ context_shape:88, classify:44, draft:48 },
          description:'Small enterprise client discovery and onboarding',
        },
      ],
    },
    {
      id:'group-b', name:'The Law', contextType:'group',
      color:'#fc8181', dominantFamily:'process', tier:'local',
      pulseProfile:'considered', irDensity:0.61, activityRecency:1,
      opCount:441, personaCount:4, contextHealth:0.74, hasPrivacy:true,
      satellites:{ top:'context', bottom:'provenance', left:'persona', topRight:'privacy' },
      verbDistribution:{ retrieve:220, classify:140, summarize:81 },
      description:'Privacy-sensitive legal firm deployment — local only',
      children:[
        {
          id:'law-kb', name:'Knowledge Base', contextType:'initiative',
          color:'#fc8181', dominantFamily:'process', tier:'local',
          pulseProfile:'steady', irDensity:0.74, activityRecency:1,
          opCount:281, personaCount:2, contextHealth:0.82, hasPrivacy:true,
          satellites:{ top:'context', bottom:'provenance', left:'persona', topRight:'privacy' },
          verbDistribution:{ retrieve:160, classify:88, pattern:33 },
          description:'Firm knowledge infrastructure',
        },
        {
          id:'law-comms', name:'Communications', contextType:'initiative',
          color:'#f6c90e', dominantFamily:'outcome', tier:'local',
          pulseProfile:'ambient', irDensity:0.38, activityRecency:6,
          opCount:120, personaCount:2, contextHealth:0.55, hasPrivacy:true,
          satellites:{ top:'context', bottom:'provenance', left:'persona', topRight:'privacy' },
          verbDistribution:{ draft:72, refine:48 },
        },
      ],
    },
  ],
};

// ─── Layout types ─────────────────────────────────────────────────────────────

type Orientation = 'left-right' | 'top-down' | 'radial' | 'free';

// ─── Node renderer ────────────────────────────────────────────────────────────

const NODE_SIZES: Record<ContextType, number> = {
  root: 28, personal: 20, group: 22, initiative: 16, 'sub-initiative': 11,
};

function pulseOpacity(profile: PulseProfile, t: number): number {
  const period = PULSE_PERIODS[profile];
  const phase  = (t % period) / period;
  if (profile === 'stalled') return 0.45 + Math.sin(phase * Math.PI * 2) * 0.15;
  if (profile === 'rapid')   return 0.65 + Math.sin(phase * Math.PI * 2) * 0.35;
  if (profile === 'ambient') return 0.35 + Math.sin(phase * Math.PI * 2) * 0.18;
  return 0.55 + Math.sin(phase * Math.PI * 2) * 0.30;
}

interface NodeProps {
  node: d3.HierarchyPointNode<CanopyNodeData>;
  orientation: Orientation;
  rotation: number;
  focused: boolean;
  selected: boolean;
  t: number;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function CanopyNode({ node, focused, selected, t, onSelect, onHover }: NodeProps) {
  const d = node.data;
  const r = NODE_SIZES[d.contextType];
  const pulseA = pulseOpacity(d.pulseProfile, t);
  const density = d.irDensity;

  const rings = Math.floor(density * 3) + 1;

  const satOrbit = r + 8 + (focused ? 4 : 0);
  const satR     = focused ? 5 : 3;
  const SAT_ANGLES: Record<string, number> = {
    top: -Math.PI/2, right: 0, bottom: Math.PI/2, left: Math.PI, topRight: -Math.PI/4,
  };
  const SAT_COLORS: Record<string, string> = {
    context:    d.contextHealth > 0.5 ? '#52b788' : 'rgba(82,183,136,0.28)',
    tier:       d.tier === 'cloud' ? '#4299e1' : d.tier === 'mixed' ? '#f6c90e' : '#52b788',
    provenance: d.opCount > 100 ? '#a0aec0' : 'rgba(160,174,192,0.3)',
    persona:    d.personaCount > 0 ? '#f6c90e' : 'rgba(246,201,14,0.2)',
    privacy:    d.hasPrivacy ? '#fc8181' : 'transparent',
  };

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(d.id)}
      onMouseEnter={() => onHover(d.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Density rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <circle key={i}
          r={r + (i + 1) * 5}
          fill="none"
          stroke={d.color}
          strokeWidth={0.5}
          opacity={(density / rings) * (0.12 - i * 0.03)}
        />
      ))}

      {/* Pulse glow */}
      <circle r={r * 2.4} fill={d.color} opacity={pulseA * 0.12} />
      <circle r={r * 1.6} fill={d.color} opacity={pulseA * 0.18} />

      {/* Selection ring */}
      {selected && (
        <circle r={r + 6} fill="none" stroke={d.color} strokeWidth={2} opacity={0.8}
          strokeDasharray="4 3" />
      )}

      {/* Core */}
      <circle r={r} fill={d.color} opacity={0.88} />

      {density > 0.5 && (
        <circle r={r * 0.55} fill="white" opacity={density * 0.18} />
      )}

      {d.contextType === 'root' && (
        <text textAnchor="middle" dominantBaseline="middle"
          fontSize={r * 0.7} fill="rgba(255,255,255,0.85)">⬡</text>
      )}
      {d.contextType === 'group' && (
        <text textAnchor="middle" dominantBaseline="middle"
          fontSize={r * 0.65} fill="rgba(255,255,255,0.8)">◈</text>
      )}

      {d.hasPrivacy && (
        <text x={r * 0.6} y={-r * 0.6} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="#fc8181">🔒</text>
      )}

      {/* Satellites */}
      {Object.entries(d.satellites).map(([pos, satType]) => {
        if (!satType) return null;
        const angle = SAT_ANGLES[pos] ?? 0;
        const sx = Math.cos(angle) * satOrbit;
        const sy = Math.sin(angle) * satOrbit;
        const col = SAT_COLORS[satType] ?? '#888';
        return (
          <circle key={pos} cx={sx} cy={sy} r={satR}
            fill={col} opacity={focused ? 0.9 : 0.5} />
        );
      })}

      {/* Label */}
      <text
        y={r + (focused ? 18 : 14)}
        textAnchor="middle"
        fontSize={focused ? 12 : d.contextType === 'root' ? 12 : d.contextType === 'group' ? 11 : 10}
        fill="rgba(255,255,255,0.88)"
        fontFamily='"JetBrains Mono", monospace'
        fontWeight={d.contextType === 'group' || d.contextType === 'root' ? '600' : '400'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {d.name}
      </text>

      {focused && (
        <text y={r + 30} textAnchor="middle" fontSize={9}
          fill="rgba(255,255,255,0.4)" fontFamily='"JetBrains Mono", monospace'
          style={{ pointerEvents:'none' }}
        >
          {d.opCount} ops · {(d.irDensity*100).toFixed(0)}% IR
        </text>
      )}
    </g>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  node, onClose,
  dim, muted, bright, border, accent, mono, surface,
}: {
  node: CanopyNodeData | null;
  onClose: () => void;
  dim: string; muted: string; bright: string;
  border: string; accent: string; mono: string; surface: string;
}) {
  if (!node) return null;

  const verbEntries = Object.entries(node.verbDistribution)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .sort(([,a],[,b]) => b-a).slice(0,5);
  const total = verbEntries.reduce((s,[,v])=>s+v,0);

  const VERB_COLORS: Record<string,string> = {
    draft:'#4299e1', synthesize:'#f6c90e', refine:'#2d9cdb',
    retrieve:'#9f7aea', classify:'#ed8936', context_shape:'#52b788',
    pattern:'#76e4f7', summarize:'#68d391',
  };

  return (
    <Box position="absolute" top={4} right={4} w="240px"
      bg={surface} border={`1px solid ${border}`} borderRadius="lg"
      overflow="hidden" backdropFilter="blur(8px)"
      boxShadow="0 8px 32px rgba(0,0,0,0.4)"
    >
      <Box p={3} borderBottom={`1px solid ${border}`} bg="rgba(255,255,255,0.03)">
        <Flex align="center" justify="space-between" mb={1}>
          <Flex align="center" gap={2}>
            <Box w={2.5} h={2.5} borderRadius="full" bg={node.color}
              style={{boxShadow:`0 0 6px ${node.color}`}}
            />
            <Text fontSize="12px" fontWeight="700" color={bright} fontFamily={mono}>
              {node.name}
            </Text>
          </Flex>
          <Box as="button" fontSize="12px" color={dim} onClick={onClose}
            _hover={{color:bright}}>✕</Box>
        </Flex>
        <Badge fontSize="8px" px={1.5} py={0.5} borderRadius="sm"
          bg="rgba(82,183,136,0.1)" color={accent} fontFamily={mono}
        >{node.contextType}</Badge>
        {node.description && (
          <Text fontSize="9px" color={dim} mt={1.5} lineHeight="1.5">{node.description}</Text>
        )}
      </Box>

      <Box p={3}>
        <Flex direction="column" gap={2.5}>
          <Box>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="8px" color={dim}>IR Density</Text>
              <Text fontSize="8px" color={muted}>{(node.irDensity*100).toFixed(0)}%</Text>
            </Flex>
            <Box h={1.5} bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
              <Box h="full" borderRadius="full"
                style={{width:`${node.irDensity*100}%`, background:node.color,
                        boxShadow:`0 0 4px ${node.color}88`}}
              />
            </Box>
          </Box>

          <Box>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="8px" color={dim}>Context Health</Text>
              <Text fontSize="8px" color={muted}>{(node.contextHealth*100).toFixed(0)}%</Text>
            </Flex>
            <Box h={1.5} bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
              <Box h="full" borderRadius="full"
                style={{width:`${node.contextHealth*100}%`, background:'#52b788',
                        boxShadow:'0 0 4px rgba(82,183,136,0.6)'}}
              />
            </Box>
          </Box>

          <Flex justify="space-between" pt={1}>
            {[
              {label:'Ops', value:node.opCount},
              {label:'Personas', value:node.personaCount},
              {label:'Recency', value:`${node.activityRecency}d`},
            ].map(s=>(
              <Flex key={s.label} direction="column" align="center">
                <Text fontSize="8px" color={dim}>{s.label}</Text>
                <Text fontSize="14px" color={bright} fontWeight="700" fontFamily={mono}>{s.value}</Text>
              </Flex>
            ))}
          </Flex>

          {verbEntries.length > 0 && (
            <Box pt={1} borderTop={`1px solid ${border}`}>
              <Text fontSize="8px" color={dim} mb={2}>Verb distribution</Text>
              {verbEntries.map(([verb, count])=>(
                <Box key={verb} mb={1.5}>
                  <Flex justify="space-between" mb={0.5}>
                    <Flex align="center" gap={1.5}>
                      <Box w={1.5} h={1.5} borderRadius="full"
                        bg={VERB_COLORS[verb]??'#888'} />
                      <Text fontSize="8px" color={dim}>{verb}</Text>
                    </Flex>
                    <Text fontSize="8px" color={muted}>{count}</Text>
                  </Flex>
                  <Box h={0.5} bg="rgba(255,255,255,0.05)" borderRadius="full" overflow="hidden">
                    <Box h="full" borderRadius="full"
                      style={{width:`${(count/total)*100}%`,
                              background:VERB_COLORS[verb]??'#888'}}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {node.hasPrivacy && (
            <Flex align="center" gap={1.5} pt={1} borderTop={`1px solid ${border}`}>
              <Text fontSize="9px" color="#fc8181">🔒</Text>
              <Text fontSize="8px" color="rgba(252,129,129,0.7)">Local-only · no cloud escalation</Text>
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CanopyTreeView() {
  const svgRef        = useRef<SVGSVGElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [orientation, setOrientation]   = useState<Orientation>('radial');
  const [rotation,    setRotation]      = useState(0);
  const [scale,       setScale]         = useState(1);
  const [translate,   setTranslate]     = useState({x:0, y:0});
  const [isDragging,  setIsDragging]    = useState(false);
  const [dragStart,   setDragStart]     = useState({x:0,y:0,tx:0,ty:0});
  const [selectedId,  setSelectedId]    = useState<string|null>(null);
  const [hoveredId,   setHoveredId]     = useState<string|null>(null);
  const [t,           setT]             = useState(0);
  const [size,        setSize]          = useState({w:800,h:600});

  useEffect(()=>{
    const id = setInterval(()=>setT(prev=>prev+16), 16);
    return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const el=containerRef.current; if(!el) return;
    const ro=new ResizeObserver(e=>{
      const {width,height}=e[0].contentRect;
      setSize({w:Math.floor(width),h:Math.floor(height)});
    });
    ro.observe(el); return ()=>ro.disconnect();
  },[]);

  const { nodes, links } = useMemo(()=>{
    const root = d3.hierarchy<CanopyNodeData>(MOCK_TREE);
    const W = size.w, H = size.h;

    let layout: d3.HierarchyPointNode<CanopyNodeData>;

    if (orientation === 'radial' || orientation === 'free') {
      const radius = Math.min(W, H) * 0.38;
      const tree   = d3.tree<CanopyNodeData>()
        .size([2 * Math.PI, radius])
        .separation((a,b) => (a.parent===b.parent ? 1.2 : 2.4) / a.depth);
      layout = tree(root);
      layout.descendants().forEach(d => {
        const angle = d.x;
        const r = d.y;
        d.x = r * Math.cos(angle - Math.PI / 2);
        d.y = r * Math.sin(angle - Math.PI / 2);
      });

    } else if (orientation === 'left-right') {
      const tree = d3.tree<CanopyNodeData>().size([H * 0.82, W * 0.72]);
      layout = tree(root);
      layout.descendants().forEach(d=>{
        const tmp = d.x;
        d.x = d.y - W * 0.36;
        d.y = tmp - H * 0.41;
      });

    } else {
      const tree = d3.tree<CanopyNodeData>().size([W * 0.82, H * 0.72]);
      layout = tree(root);
      layout.descendants().forEach(d=>{
        d.x = d.x - W * 0.41;
        d.y = d.y - H * 0.1;
      });
    }

    return { nodes: layout.descendants(), links: layout.links() };
  }, [orientation, size]);

  const selectedNode = selectedId
    ? nodes.find(n=>n.data.id===selectedId)?.data ?? null
    : null;

  const onMouseDown = useCallback((e: React.MouseEvent)=>{
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({x:e.clientX,y:e.clientY,tx:translate.x,ty:translate.y});
    }
  },[translate]);

  const onMouseMove = useCallback((e: React.MouseEvent)=>{
    if (isDragging) {
      setTranslate({
        x:dragStart.tx+(e.clientX-dragStart.x),
        y:dragStart.ty+(e.clientY-dragStart.y),
      });
    }
  },[isDragging,dragStart]);

  const onMouseUp = useCallback(()=>setIsDragging(false),[]);

  const onWheel = useCallback((e: React.WheelEvent)=>{
    e.preventDefault();
    setScale(s=>Math.max(0.3,Math.min(3,s*(e.deltaY<0?1.08:0.92))));
  },[]);

  function linkPath(link: d3.HierarchyPointLink<CanopyNodeData>): string {
    const sx = link.source.x;
    const sy = link.source.y;
    const tx = link.target.x;
    const ty = link.target.y;
    const mx=(sx+tx)/2, my=(sy+ty)/2;
    return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
  }

  const bg='#0d1117', surface='#161b22';
  const border='rgba(82,183,136,0.17)', accent='#52b788';
  const dim='rgba(255,255,255,0.3)', muted='rgba(255,255,255,0.58)', bright='rgba(255,255,255,0.92)';
  const mono='"JetBrains Mono","Fira Code",monospace';
  const display='"Syne",sans-serif';

  const cx = size.w/2 + translate.x;
  const cy = size.h/2 + translate.y;
  const transform = `translate(${cx},${cy}) rotate(${rotation}) scale(${scale})`;

  const ORIENTATION_OPTS: {id:Orientation; label:string; icon:React.ComponentType<{ size?: number }>}[] = [
    {id:'radial',    label:'Radial',    icon:IconCircleDot},
    {id:'left-right',label:'Horizontal',icon:IconArrowRight},
    {id:'top-down',  label:'Vertical',  icon:IconArrowDown},
    {id:'free',      label:'Free',      icon:IconLayoutBoard},
  ];

  return (
    <Box bg={bg} minH="100vh" color={bright} fontFamily={mono} overflow="hidden" position="relative">

      {/* Header */}
      <Flex px={5} py={2.5} borderBottom={`1px solid ${border}`} align="center" gap={4} bg={surface}>
        <Flex align="center" gap={2} minW="fit-content">
          <Box w={2} h={2} borderRadius="full" bg={accent} style={{boxShadow:`0 0 8px ${accent}`}}/>
          <Text fontFamily={display} fontSize="sm" fontWeight="700" color={accent} letterSpacing="0.15em">CANOPY</Text>
          <Text fontSize="xs" color={dim}>/ workspace</Text>
        </Flex>

        <Flex flex={1} align="center" gap={3} justify="center">

          <Flex align="center" gap={1} px={2} py={1.5}
            bg="rgba(82,183,136,0.07)" border={`1px solid ${border}`} borderRadius="md"
          >
            {ORIENTATION_OPTS.map(opt=>{
              const Icon=opt.icon; const active=orientation===opt.id;
              return (
                <Flex key={opt.id} align="center" gap={1} px={2} py={0.5}
                  borderRadius="sm" cursor="pointer"
                  bg={active?accent:'transparent'}
                  color={active?bg:dim}
                  _hover={{color:active?bg:accent}}
                  onClick={()=>setOrientation(opt.id)}
                  transition="all 0.15s"
                >
                  <Icon size={11}/>
                  <Text fontSize="8px" letterSpacing="0.06em">{opt.label.toUpperCase()}</Text>
                </Flex>
              );
            })}
          </Flex>

          {(orientation==='free'||orientation==='radial') && (
            <Flex align="center" gap={2} px={3} py={1.5}
              bg="rgba(82,183,136,0.07)" border={`1px solid ${border}`} borderRadius="md"
            >
              <Text fontSize="8px" color={dim}>ROTATE</Text>
              {[-45,-15,0,15,45].map(deg=>(
                <Box key={deg} as="button" px={1.5} py={0.5} fontSize="9px" borderRadius="sm"
                  cursor="pointer" fontFamily={mono}
                  bg={rotation===deg?accent:'transparent'}
                  color={rotation===deg?bg:dim}
                  _hover={{color:accent}}
                  onClick={()=>setRotation(deg)}
                >{deg}°</Box>
              ))}
            </Flex>
          )}

          <Flex align="center" gap={1.5} px={3} py={1.5}
            bg="rgba(82,183,136,0.07)" border={`1px solid ${border}`} borderRadius="md"
          >
            <IconButton size="xs" variant="ghost" color={dim} _hover={{color:accent}}
              aria-label="zoom out" onClick={()=>setScale(s=>Math.max(0.3,s*0.85))}
            ><IconZoomOut size={13}/></IconButton>
            <Text fontSize="9px" color={dim} w="32px" textAlign="center">{(scale*100).toFixed(0)}%</Text>
            <IconButton size="xs" variant="ghost" color={dim} _hover={{color:accent}}
              aria-label="zoom in" onClick={()=>setScale(s=>Math.min(3,s*1.15))}
            ><IconZoomIn size={13}/></IconButton>
            <Box w="1px" h={3} bg={border} mx={0.5}/>
            <IconButton size="xs" variant="ghost" color={dim} _hover={{color:accent}}
              aria-label="reset" onClick={()=>{setScale(1);setTranslate({x:0,y:0});setRotation(0);}}
            ><IconRefresh size={13}/></IconButton>
          </Flex>
        </Flex>

        <Flex align="center" gap={1.5}>
          <Box w={1.5} h={1.5} borderRadius="full" bg={accent}
            style={{boxShadow:`0 0 5px ${accent}`,animation:'cPulse 2.5s ease-in-out infinite'}}/>
          <Text fontSize="9px" color={dim}>{nodes.length} nodes</Text>
        </Flex>
      </Flex>

      {/* Canvas */}
      <Box ref={containerRef} position="relative" h="calc(100vh - 50px)"
        cursor={isDragging?'grabbing':'grab'}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <svg ref={svgRef} width={size.w} height={size.h}
          style={{display:'block',width:'100%',height:'100%'}}
        >
          <rect width={size.w} height={size.h} fill="transparent"/>

          <g transform={transform}>
            {links.map((link,i)=>{
              const src = link.source.data;
              const tgt = link.target.data;
              const hovered = hoveredId===src.id||hoveredId===tgt.id;
              const selected= selectedId===src.id||selectedId===tgt.id;
              return (
                <path key={i}
                  d={linkPath(link)}
                  fill="none"
                  stroke={selected?tgt.color:hovered?`${tgt.color}88`:'rgba(255,255,255,0.06)'}
                  strokeWidth={selected?2:hovered?1.5:1}
                  strokeDasharray={tgt.contextType==='sub-initiative'?'4 3':undefined}
                  opacity={selected?0.9:hovered?0.6:0.4}
                  style={{transition:'opacity 0.2s,stroke 0.2s'}}
                />
              );
            })}

            {nodes.map(node=>(
              <CanopyNode key={node.data.id}
                node={node as d3.HierarchyPointNode<CanopyNodeData>}
                orientation={orientation}
                rotation={rotation}
                focused={hoveredId===node.data.id}
                selected={selectedId===node.data.id}
                t={t}
                onSelect={id=>setSelectedId(prev=>prev===id?null:id)}
                onHover={setHoveredId}
              />
            ))}
          </g>
        </svg>

        <Box position="absolute" bottom={5} left={4}>
          <Flex gap={2.5} px={3} py={2}
            bg="rgba(13,17,23,0.9)" border={`1px solid ${border}`}
            borderRadius="md" backdropFilter="blur(4px)" wrap="wrap" maxW="480px"
          >
            <Text fontSize="8px" color={dim} letterSpacing="0.1em" mr={1}>FAMILY</Text>
            {Object.entries(FAMILY_COLORS).filter(([k])=>k!=='mixed').map(([fam,col])=>(
              <Flex key={fam} align="center" gap={1.5}>
                <Box w={2} h={2} borderRadius="full" bg={col}/>
                <Text fontSize="8px" color={dim}>{fam}</Text>
              </Flex>
            ))}
            <Box w="1px" h={3} bg={border}/>
            <Text fontSize="8px" color={dim} mr={1}>RINGS</Text>
            <Text fontSize="8px" color={dim}>= IR density</Text>
            <Box w="1px" h={3} bg={border}/>
            <Flex align="center" gap={1}><Text fontSize="8px" color="rgba(252,129,129,0.6)">🔒</Text><Text fontSize="8px" color={dim}>local-only</Text></Flex>
          </Flex>
        </Box>

        <Box position="absolute" bottom={5} right={selectedNode?260:4}>
          <Flex gap={3} px={3} py={2}
            bg="rgba(13,17,23,0.88)" border={`1px solid ${border}`}
            borderRadius="md" backdropFilter="blur(4px)"
          >
            <Text fontSize="8px" color={dim}>drag to pan</Text>
            <Text fontSize="8px" color={dim}>·</Text>
            <Text fontSize="8px" color={dim}>scroll to zoom</Text>
            <Text fontSize="8px" color={dim}>·</Text>
            <Text fontSize="8px" color={dim}>click node to inspect</Text>
          </Flex>
        </Box>

        <DetailPanel
          node={selectedNode}
          onClose={()=>setSelectedId(null)}
          dim={dim} muted={muted} bright={bright}
          border={border} accent={accent} mono={mono} surface={surface}
        />
      </Box>

      <style>{`
        @keyframes cPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>
    </Box>
  );
}
