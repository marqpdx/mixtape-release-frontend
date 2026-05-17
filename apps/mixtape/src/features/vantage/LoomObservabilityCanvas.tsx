'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, Badge, IconButton } from '@chakra-ui/react';
import {
  IconPlayerPlay, IconPlayerPause, IconPlayerSkipBack,
  IconZoomIn, IconActivity, IconAlertTriangle, IconCheck,
  IconClock, IconWaveSine, IconBrandSpeedtest, IconShield,
  IconCpu, IconDatabase,
} from '@tabler/icons-react';

// ─── Codex ───────────────────────────────────────────────────────────────────
// Derived from reference/loom/codex.md — single source of truth for all visual/behavioral props

type VerbFamily    = 'outcome' | 'process' | 'governance' | 'inquiry' | 'substrate';
type Morphology    = 'round' | 'elongated' | 'faceted' | 'diffuse';
type MassClass     = 'cessna' | 'jumbo' | 'dynamic';
type PulseProfile  = 'steady' | 'considered' | 'rapid' | 'ambient';
type TrailWidth    = 'wide' | 'thin' | 'none';
type VantageReg    = 'bolus' | 'arrival-event' | 'query-pulse' | 'geological-event';

interface SatelliteConfig {
  top?: 'context'; right?: 'tier'; bottom?: 'provenance';
  left?: 'persona'; topRight?: 'privacy';
}
interface CodexEntry {
  id: string; family: VerbFamily; label: string; color: string;
  morphology: Morphology; massClass: MassClass; pulseProfile: PulseProfile;
  trailWidth: TrailWidth; vantageRegister: VantageReg;
  satellites: SatelliteConfig; cloudEligible: boolean; helpText: string;
}

const CODEX: Record<string, CodexEntry> = {
  draft: {
    id:'draft', family:'outcome', label:'draft', color:'#4299e1',
    morphology:'round', massClass:'dynamic', pulseProfile:'considered',
    trailWidth:'wide', vantageRegister:'bolus',
    satellites:{ top:'context', right:'tier', bottom:'provenance', left:'persona', topRight:'privacy' },
    cloudEligible:true, helpText:'Produces a draft in the voice of a defined Persona.',
  },
  synthesize: {
    id:'synthesize', family:'outcome', label:'synth', color:'#f6c90e',
    morphology:'round', massClass:'jumbo', pulseProfile:'considered',
    trailWidth:'wide', vantageRegister:'bolus',
    satellites:{ top:'context', right:'tier', bottom:'provenance', left:'persona', topRight:'privacy' },
    cloudEligible:true, helpText:'Draws across multiple sources to produce a unified insight.',
  },
  refine: {
    id:'refine', family:'outcome', label:'refine', color:'#2d9cdb',
    morphology:'round', massClass:'dynamic', pulseProfile:'considered',
    trailWidth:'wide', vantageRegister:'bolus',
    satellites:{ top:'context', right:'tier', bottom:'provenance', left:'persona' },
    cloudEligible:true, helpText:'Improves an existing document based on your feedback.',
  },
  retrieve: {
    id:'retrieve', family:'process', label:'retrieve', color:'#9f7aea',
    morphology:'elongated', massClass:'cessna', pulseProfile:'steady',
    trailWidth:'thin', vantageRegister:'bolus',
    satellites:{ top:'context', bottom:'provenance' },
    cloudEligible:false, helpText:'Finds the most relevant knowledge from your accumulated context.',
  },
  classify: {
    id:'classify', family:'process', label:'classify', color:'#ed8936',
    morphology:'elongated', massClass:'cessna', pulseProfile:'steady',
    trailWidth:'thin', vantageRegister:'bolus',
    satellites:{ bottom:'provenance' },
    cloudEligible:false, helpText:'Assigns categories and tags to content.',
  },
  context_shape: {
    id:'context_shape', family:'process', label:'ctx_shape', color:'#52b788',
    morphology:'faceted', massClass:'cessna', pulseProfile:'steady',
    trailWidth:'thin', vantageRegister:'bolus',
    satellites:{ top:'context', bottom:'provenance' },
    cloudEligible:false, helpText:'Turns a rough description into structured initiative context.',
  },
  pattern: {
    id:'pattern', family:'process', label:'pattern', color:'#76e4f7',
    morphology:'diffuse', massClass:'dynamic', pulseProfile:'ambient',
    trailWidth:'thin', vantageRegister:'bolus',
    satellites:{ top:'context', right:'tier', bottom:'provenance' },
    cloudEligible:true, helpText:'Surfaces patterns across your accumulated context.',
  },
  summarize: {
    id:'summarize', family:'process', label:'summarize', color:'#68d391',
    morphology:'elongated', massClass:'dynamic', pulseProfile:'steady',
    trailWidth:'thin', vantageRegister:'bolus',
    satellites:{ top:'context', right:'tier', bottom:'provenance' },
    cloudEligible:true, helpText:'Distills a document or collection into a readable summary.',
  },
};

const FAMILY_COLORS: Record<string,string> = {
  outcome:'#4299e1', process:'#9f7aea', governance:'#f6c90e',
  inquiry:'rgba(255,255,255,0.5)', substrate:'#2d6a4f',
};

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { id:'intent',     label:'Intent',     icon:IconWaveSine,       x:0.06 },
  { id:'dispatch',   label:'Dispatch',   icon:IconBrandSpeedtest, x:0.22 },
  { id:'approval',   label:'Approval',   icon:IconShield,         x:0.40 },
  { id:'execution',  label:'Execution',  icon:IconCpu,            x:0.58 },
  { id:'memory',     label:'Memory',     icon:IconDatabase,       x:0.75 },
  { id:'provenance', label:'Provenance', icon:IconCheck,          x:0.92 },
];

function getLaneBand(entry: CodexEntry, tier: string): [number,number] {
  if (tier === 'cloud') return [0.08, 0.34];
  if (entry.family === 'outcome') return [0.30, 0.58];
  return [0.52, 0.82];
}

function dwellFor(stageId: string, entry: CodexEntry, tier: string): number {
  const base: Record<string,number> = {
    intent:8, dispatch:14, approval: entry.cloudEligible ? 55 : 18,
    execution: entry.massClass === 'jumbo' ? 75 : 28, memory:18, provenance:14,
  };
  const d = base[stageId] ?? 20;
  return tier === 'cloud' ? Math.floor(d * 2.1)
       : entry.pulseProfile === 'ambient' ? Math.floor(d * 1.5) : d;
}

// ─── Op model ─────────────────────────────────────────────────────────────────

interface Op {
  id:string; verb:string; entry:CodexEntry; tier:'local'|'cloud';
  stageIdx:number; dwellProgress:number; dwellDuration:number;
  x:number; y:number; targetY:number;
  trail:{x:number;y:number}[];
  status:'active'|'approval_wait'|'error'|'completing';
  group:string; persona:string|null;
  hasContext:boolean; hasPrivacy:boolean;
  latency:number; pulse:number;
}

let opCounter = 1000;
function makeOp(overrides: Partial<Op> = {}): Op {
  const verb = Object.keys(CODEX)[Math.floor(Math.random() * Object.keys(CODEX).length)];
  const entry = CODEX[verb];
  const tier  = (entry.cloudEligible && Math.random() > 0.74) ? 'cloud' : 'local';
  const [yMin,yMax] = getLaneBand(entry, tier);
  const raw: Op = {
    id:`op-${opCounter++}`, verb, entry, tier,
    stageIdx:0, dwellProgress:0, dwellDuration:dwellFor(STAGES[0].id, entry, tier),
    x:STAGES[0].x, y:0.5, targetY: yMin + Math.random()*(yMax-yMin),
    trail:[],
    status: Math.random() > 0.88 ? (Math.random() > 0.5 ? 'approval_wait' : 'error') : 'active',
    group:`Group-${Math.floor(Math.random()*8)+1}`,
    persona: Math.random() > 0.45 ? ['Jan','Marcus','Priya','Dev'][Math.floor(Math.random()*4)] : null,
    hasContext: Math.random() > 0.28,
    hasPrivacy: Math.random() > 0.82,
    latency: Math.floor(Math.random()*900)+20,
    pulse: Math.floor(Math.random()*300),
  };
  return { ...raw, ...overrides };
}

// ─── Mock inventory & anomalies ───────────────────────────────────────────────

const INVENTORY_ITEMS = [
  { id:'inkwell-1',   name:'Inkwell',     type:'execution', tier:'local', model:'Qwen2.5-7B',    status:'healthy', ops:142,  latencyP90:340  },
  { id:'inkwell-2',   name:'Inkwell',     type:'execution', tier:'local', model:'BGE-base',      status:'healthy', ops:891,  latencyP90:45   },
  { id:'switchboard', name:'Switchboard', type:'dispatch',  tier:'local', model:null,            status:'healthy', ops:1204, latencyP90:12   },
  { id:'stackroom',   name:'Stackroom',   type:'memory',    tier:'local', model:null,            status:'healthy', ops:678,  latencyP90:28   },
  { id:'qdrant',      name:'Qdrant',      type:'memory',    tier:'local', model:null,            status:'healthy', ops:445,  latencyP90:18   },
  { id:'claude-cloud',name:'Claude',      type:'execution', tier:'cloud', model:'claude-sonnet', status:'healthy', ops:23,   latencyP90:1840 },
  { id:'whisper',     name:'Whisper',     type:'execution', tier:'local', model:'faster-whisper',status:'busy',    ops:8,    latencyP90:4200 },
  { id:'celery',      name:'Celery',      type:'async',     tier:'local', model:null,            status:'healthy', ops:56,   latencyP90:2100 },
];

const ANOMALIES = [
  { id:'a1', time:'14:32:01.441', verb:'synthesize', msg:'Cloud approval stalled — 12s wait',         severity:'warn'  },
  { id:'a2', time:'14:32:00.218', verb:'draft',      msg:'JSON schema validation failed — retry 1/2', severity:'error' },
  { id:'a3', time:'14:31:58.002', verb:'retrieve',   msg:'Latency spike: 892ms (p90: 45ms)',          severity:'warn'  },
];

// ─── Canvas draw helpers ──────────────────────────────────────────────────────

function drawBolus(
  ctx:CanvasRenderingContext2D, op:Op,
  W:number, H:number, frame:number,
  inFocus:boolean, smoothed:boolean,
) {
  const { entry } = op;
  const x = op.x * W, y = op.y * H;
  const baseR = entry.massClass==='jumbo' ? 14 : entry.massClass==='cessna' ? 7
    : op.hasContext ? 12 : 8;
  const r = inFocus ? baseR * 1.28 : baseR;

  if (op.trail.length > 1 && entry.trailWidth !== 'none') {
    const tw = entry.trailWidth==='wide' ? (inFocus?4:2.5) : (inFocus?2:1.2);
    ctx.beginPath();
    ctx.moveTo(op.trail[0].x*W, op.trail[0].y*H);
    for (let i=1; i<op.trail.length; i++) ctx.lineTo(op.trail[i].x*W, op.trail[i].y*H);
    const tg = ctx.createLinearGradient(op.trail[0].x*W, op.trail[0].y*H, x, y);
    tg.addColorStop(0, `${entry.color}00`);
    tg.addColorStop(1, smoothed ? `${entry.color}55` : `${entry.color}33`);
    ctx.strokeStyle=tg; ctx.lineWidth=tw; ctx.lineCap='round'; ctx.stroke();
  }

  if (inFocus && op.trail.length > 5) {
    const g = op.trail[op.trail.length-5];
    ctx.beginPath(); ctx.arc(g.x*W, g.y*H, r*0.55, 0, Math.PI*2);
    ctx.fillStyle=`${entry.color}16`; ctx.fill();
  }

  const gr = r * (smoothed?4.2:2.8);
  const gg = ctx.createRadialGradient(x,y,0,x,y,gr);
  gg.addColorStop(0,`${entry.color}${smoothed?'40':'28'}`); gg.addColorStop(1,`${entry.color}00`);
  ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(x,y,gr,0,Math.PI*2); ctx.fill();

  if (op.status==='approval_wait') {
    const t=(frame+op.pulse)*0.065;
    const pr=r+7+Math.sin(t)*4, pa=0.32+Math.sin(t)*0.28;
    ctx.strokeStyle=`rgba(246,201,14,${pa})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(x,y,pr,0,Math.PI*2); ctx.stroke();
  }
  if (op.status==='error') {
    ctx.strokeStyle='rgba(252,129,129,0.6)'; ctx.lineWidth=1.8;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.arc(x,y,r+5,0,Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save(); ctx.translate(x,y);
  const actualR = entry.morphology==='diffuse' ? r*1.35 : r;
  if (entry.morphology==='elongated') ctx.scale(smoothed?3:1.9, 1);

  if (entry.morphology==='faceted') {
    ctx.beginPath();
    for (let i=0;i<6;i++) {
      const a=(i/6)*Math.PI*2-Math.PI/6, jitter=1+Math.sin(i*2.3)*0.11;
      const rx=Math.cos(a)*actualR*jitter, ry=Math.sin(a)*actualR*jitter;
      if (i === 0) {
        ctx.moveTo(rx, ry);
      } else {
        ctx.lineTo(rx, ry);
      }
    }
    ctx.closePath();
  } else {
    ctx.beginPath(); ctx.arc(0,0,actualR,0,Math.PI*2);
  }

  const cg = ctx.createRadialGradient(-actualR*.3,-actualR*.3,0,0,0,actualR);
  const alpha = entry.morphology==='diffuse' ? 'bb' : 'ff';
  cg.addColorStop(0,`${entry.color}${alpha}`); cg.addColorStop(1,`${entry.color}77`);
  ctx.fillStyle=cg; ctx.fill();

  if (entry.family==='outcome' && !smoothed) {
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(actualR*.28,-actualR*.28,actualR*.2,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  if (op.tier==='cloud' && !smoothed) {
    ctx.font=`${Math.max(8,r-2)}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,255,255,0.82)';
    ctx.fillText('☁',x,y); ctx.textBaseline='alphabetic';
  }

  if (!smoothed) {
    const satR   = inFocus ? 5 : 3;
    const satAlpha = inFocus ? 1 : 0.5;
    const orbitR = r + satR + (inFocus?8:4);
    const t      = (frame+op.pulse)*0.012;
    const SAT_COLORS: Record<string,string> = {
      context:    op.hasContext ? '#52b788' : 'rgba(82,183,136,0.22)',
      tier:       op.tier==='cloud' ? '#4299e1' : '#52b788',
      provenance: '#a0aec0',
      persona:    op.persona ? '#f6c90e' : 'rgba(246,201,14,0.18)',
      privacy:    op.hasPrivacy ? '#fc8181' : 'rgba(0,0,0,0)',
    };
    const positions: [string|undefined, number][] = [
      [op.entry.satellites.top,      -Math.PI/2],
      [op.entry.satellites.right,     0],
      [op.entry.satellites.bottom,    Math.PI/2],
      [op.entry.satellites.left,      Math.PI],
      [op.entry.satellites.topRight, -Math.PI/4],
    ];
    positions.forEach(([st, baseAngle]) => {
      if (!st) return;
      const angle = baseAngle + Math.sin(t+baseAngle)*0.07;
      const sx=x+Math.cos(angle)*orbitR, sy=y+Math.sin(angle)*orbitR;
      ctx.beginPath(); ctx.arc(sx,sy,satR,0,Math.PI*2);
      const sc = SAT_COLORS[st]??'#888';
      ctx.fillStyle = sc.startsWith('rgba') ? sc
        : `${sc}${Math.round(satAlpha*255).toString(16).padStart(2,'0')}`;
      ctx.fill();
    });
  }

  const showLabel = inFocus || entry.massClass==='jumbo';
  if (showLabel && !smoothed) {
    ctx.font=`${inFocus?11:9}px "JetBrains Mono",monospace`;
    ctx.fillStyle=`rgba(255,255,255,${inFocus?0.88:0.6})`;
    ctx.textAlign='center';
    ctx.fillText(entry.label, x, y-r-(inFocus?8:5));
  }
}

function drawArrivalEvent(
  ctx:CanvasRenderingContext2D, x:number, y:number,
  color:string, maxR:number, localFrame:number,
) {
  for (let ring=0; ring<3; ring++) {
    const age = (localFrame + ring*38) % 110;
    const r=(age/110)*maxR, alpha=(1-age/110)*0.55;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle=`${color}${Math.round(alpha*255).toString(16).padStart(2,'0')}`;
    ctx.lineWidth=2; ctx.stroke();
  }
}

function drawQueryPulse(
  ctx:CanvasRenderingContext2D, x:number, y:number, localFrame:number,
) {
  const age = localFrame % 75;
  const r=(age/75)*55, alpha=(1-age/75)*0.35;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.strokeStyle=`rgba(255,255,255,${alpha})`;
  ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
}

// ─── Canvas hook ──────────────────────────────────────────────────────────────

function useVantageCanvas(
  opsRef: React.MutableRefObject<Op[]>,
  focusRegion: {x1:number;x2:number}|null,
  smoothed: boolean,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const frameRef = useRef(0);
  const animRef  = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function draw() {
      const W=canvas!.width, H=canvas!.height;
      frameRef.current++;
      const frame = frameRef.current;
      ctx.clearRect(0,0,W,H);

      if (!smoothed) {
        ctx.strokeStyle='rgba(255,255,255,0.022)'; ctx.lineWidth=1;
        for (let gx=0;gx<W;gx+=56){ ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke(); }
        for (let gy=0;gy<H;gy+=56){ ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke(); }

        [
          { y:0.21, color:'rgba(66,153,225,0.055)'  },
          { y:0.44, color:'rgba(82,183,136,0.045)'  },
          { y:0.67, color:'rgba(159,122,234,0.045)' },
        ].forEach(ch => {
          const cy=ch.y*H;
          const g=ctx.createLinearGradient(0,cy-30,0,cy+30);
          g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.5,ch.color); g.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=g; ctx.fillRect(0,cy-30,W,60);
        });

        STAGES.forEach(s => {
          const sx=s.x*W;
          const sg=ctx.createLinearGradient(sx-22,0,sx+22,0);
          sg.addColorStop(0,'rgba(82,183,136,0)'); sg.addColorStop(0.5,'rgba(82,183,136,0.048)'); sg.addColorStop(1,'rgba(82,183,136,0)');
          ctx.fillStyle=sg; ctx.fillRect(sx-22,0,44,H);
          ctx.setLineDash([3,7]); ctx.strokeStyle='rgba(82,183,136,0.11)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(sx,30); ctx.lineTo(sx,H-22); ctx.stroke(); ctx.setLineDash([]);
        });

        const ax=STAGES[2].x*W;
        const ag=ctx.createLinearGradient(ax-48,0,ax+48,0);
        ag.addColorStop(0,'rgba(246,201,14,0)'); ag.addColorStop(0.5,'rgba(246,201,14,0.048)'); ag.addColorStop(1,'rgba(246,201,14,0)');
        ctx.fillStyle=ag; ctx.fillRect(ax-48,0,96,H);

        if (focusRegion) {
          const fx1=focusRegion.x1*W, fx2=focusRegion.x2*W;
          ctx.fillStyle='rgba(66,153,225,0.065)'; ctx.fillRect(fx1,0,fx2-fx1,H);
          ctx.strokeStyle='rgba(66,153,225,0.42)'; ctx.lineWidth=1.5;
          ctx.setLineDash([6,4]); ctx.strokeRect(fx1,2,fx2-fx1,H-4); ctx.setLineDash([]);
          ctx.font='9px "JetBrains Mono",monospace'; ctx.fillStyle='rgba(66,153,225,0.65)'; ctx.textAlign='center';
          ctx.fillText('FOCUS',(fx1+fx2)/2,14);
        }
      }

      opsRef.current.forEach(op => {
        if (op.entry.vantageRegister!=='bolus') return;
        const inFocus=!!focusRegion && op.x>=focusRegion.x1 && op.x<=focusRegion.x2;
        drawBolus(ctx,op,W,H,frame,inFocus,smoothed);
      });

      if (!smoothed) {
        const localA = frame % 200;
        if (localA < 70) drawArrivalEvent(ctx, STAGES[2].x*W, H*0.40, '#f6c90e', 70, localA);

        const localQ = frame % 260;
        if (localQ < 75) drawQueryPulse(ctx, STAGES[0].x*W, H*0.5, localQ);
      }

      if (!smoothed) {
        ctx.font='8px "JetBrains Mono",monospace'; ctx.fillStyle='rgba(82,183,136,0.38)';
        STAGES.forEach(s => { ctx.textAlign='center'; ctx.fillText(s.label.toUpperCase(), s.x*W, H-8); });
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [focusRegion, smoothed, canvasRef, opsRef]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoomObservabilityCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const opsRef       = useRef<Op[]>([]);

  const [ops, setOps] = useState<Op[]>(() => {
    const init = Array.from({length:15}, () =>
      makeOp({ stageIdx:Math.floor(Math.random()*STAGES.length),
               x:STAGES[Math.floor(Math.random()*STAGES.length)].x })
    );
    opsRef.current = init; return init;
  });

  const [playing,       setPlaying]       = useState(true);
  const [speed,         setSpeed]         = useState(1.0);
  const [smoothed,      setSmoothed]      = useState(false);
  const [focusRegion,   setFocusRegion]   = useState<{x1:number;x2:number}|null>(null);
  const [isFocusing,    setIsFocusing]    = useState(false);
  const [focusStart,    setFocusStart]    = useState<number|null>(null);
  const [activePanel,   setActivePanel]   = useState<'inventory'|'anomalies'|'stats'>('inventory');
  const [canvasSize,    setCanvasSize]    = useState({w:1000,h:500});

  useEffect(() => {
    const el=containerRef.current; if (!el) return;
    const ro=new ResizeObserver(e=>{
      const {width,height}=e[0].contentRect;
      setCanvasSize({w:Math.floor(width),h:Math.floor(height)});
    });
    ro.observe(el); return ()=>ro.disconnect();
  },[]);

  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(()=>{
      setOps(prev=>{
        const next = prev.map(op=>{
          const dp = op.dwellProgress + speed * 0.8;
          if (dp >= op.dwellDuration) {
            const ni = op.stageIdx+1;
            if (ni >= STAGES.length) return null as unknown as Op;
            const ns = STAGES[ni];
            const [yMin,yMax] = getLaneBand(op.entry, op.tier);
            return {
              ...op, stageIdx:ni, dwellProgress:0,
              dwellDuration:dwellFor(ns.id, op.entry, op.tier),
              x:ns.x, targetY:yMin+Math.random()*(yMax-yMin), trail:[],
              status: ns.id==='approval' && op.entry.cloudEligible && op.tier==='cloud'
                ? 'approval_wait' : 'active',
            };
          }
          const stX = STAGES[op.stageIdx].x;
          const xBreath = stX + Math.sin(dp*0.055+op.pulse*0.02)*0.009;
          const yLerp   = op.y + (op.targetY-op.y)*0.035;
          const yOsc    = yLerp + Math.sin(dp*0.075+op.pulse*0.01)*0.005;
          const trail   = [...op.trail, {x:op.x,y:op.y}].slice(-26);
          return {...op, dwellProgress:dp, x:xBreath, y:Math.max(0.04,Math.min(0.96,yOsc)), trail};
        }).filter(Boolean) as Op[];

        if (Math.random()<0.11*speed && next.length<36) next.push(makeOp());
        opsRef.current=next; return next;
      });
    },32);
    return ()=>clearInterval(tick);
  },[playing,speed]);

  useVantageCanvas(opsRef, focusRegion, smoothed, canvasRef);

  const onMouseDown=(e:React.MouseEvent)=>{
    if (!isFocusing) return;
    setFocusStart((e.clientX-canvasRef.current!.getBoundingClientRect().left)/canvasRef.current!.getBoundingClientRect().width);
  };
  const onMouseUp=(e:React.MouseEvent)=>{
    if (!isFocusing||focusStart===null) return;
    const r=canvasRef.current!.getBoundingClientRect();
    const end=(e.clientX-r.left)/r.width;
    const x1=Math.min(focusStart,end), x2=Math.max(focusStart,end);
    if (x2-x1>0.02){ setFocusRegion({x1,x2}); setSpeed(0.1); }
    setFocusStart(null);
  };
  const clearFocus=()=>{ setFocusRegion(null); setIsFocusing(false); setSpeed(1.0); };

  const bg='#0d1117', surface='#161b22';
  const border='rgba(82,183,136,0.17)', accent='#52b788';
  const dim='rgba(255,255,255,0.3)', muted='rgba(255,255,255,0.58)', bright='rgba(255,255,255,0.92)';
  const mono='"JetBrains Mono","Fira Code",monospace';
  const display='"Syne",sans-serif';

  return (
    <Box bg={bg} minH="100vh" color={bright} fontFamily={mono} overflow="hidden">

      {/* Header */}
      <Flex px={5} py={2.5} borderBottom={`1px solid ${border}`} align="center" gap={4} bg={surface}>

        <Flex align="center" gap={2} minW="fit-content">
          <Box w={2} h={2} borderRadius="full" bg={accent} style={{boxShadow:`0 0 8px ${accent}`}}/>
          <Text fontFamily={display} fontSize="sm" fontWeight="700" color={accent} letterSpacing="0.15em">VANTAGE</Text>
          <Text fontSize="xs" color={dim}>/ loom</Text>
        </Flex>

        <Flex flex={1} align="center" gap={3} justify="center">

          <Flex align="center" gap={2} px={3} py={1.5}
            bg="rgba(82,183,136,0.07)" border={`1px solid ${border}`} borderRadius="md"
          >
            <IconButton size="xs" variant="ghost" aria-label="reset" color={dim} _hover={{color:accent}}
              onClick={()=>{ const f=Array.from({length:13},()=>makeOp()); opsRef.current=f; setOps(f); }}
            ><IconPlayerSkipBack size={13}/></IconButton>
            <IconButton size="xs" variant="ghost" aria-label="play" color={playing?accent:dim} _hover={{color:accent}}
              onClick={()=>setPlaying(p=>!p)}
            >{playing?<IconPlayerPause size={13}/>:<IconPlayerPlay size={13}/>}</IconButton>
            <Box w="1px" h={3.5} bg={border} mx={1}/>
            <Text fontSize="8px" color={dim} mr={0.5}>SPEED</Text>
            {[0.05,0.1,0.25,0.5,1.0,2.0].map(s=>(
              <Box key={s} as="button" px={1.5} py={0.5} fontSize="10px" borderRadius="sm"
                fontFamily={mono} cursor="pointer"
                bg={Math.abs(speed-s)<0.01?accent:'transparent'}
                color={Math.abs(speed-s)<0.01?bg:dim}
                _hover={{color:accent}} onClick={()=>setSpeed(s)}
              >{s}×</Box>
            ))}
          </Flex>

          <Flex align="center" gap={1} px={1.5} py={1.5}
            bg="rgba(82,183,136,0.07)" border={`1px solid ${border}`} borderRadius="md"
          >
            {(['PRECISION','FLOW'] as const).map((v,i)=>{
              const active=(i===0)?!smoothed:smoothed;
              return (
                <Box key={v} as="button" px={2} py={0.5} fontSize="9px" borderRadius="sm" cursor="pointer"
                  bg={active?accent:'transparent'} color={active?bg:dim}
                  _hover={{color:active?bg:accent}} onClick={()=>setSmoothed(i===1)}
                >{v}</Box>
              );
            })}
          </Flex>

          <Flex align="center" gap={2} px={3} py={1.5} cursor="pointer"
            bg={isFocusing?'rgba(66,153,225,0.1)':'rgba(82,183,136,0.07)'}
            border={`1px solid ${isFocusing?'rgba(66,153,225,0.42)':border}`}
            borderRadius="md" transition="all 0.2s" onClick={()=>setIsFocusing(f=>!f)}
          >
            <IconZoomIn size={12} color={isFocusing?'#4299e1':dim}/>
            <Text fontSize="9px" color={isFocusing?'#4299e1':dim}>
              {isFocusing?'DRAG TO FOCUS':'FOCUS REGION'}
            </Text>
            {focusRegion&&(
              <Box as="button" ml={1} fontSize="10px" color="#fc8181"
                onClick={e=>{e.stopPropagation();clearFocus();}}>✕</Box>
            )}
          </Flex>
        </Flex>

        <Flex align="center" gap={1.5}>
          <Box w={1.5} h={1.5} borderRadius="full" bg="#fc8181"
            style={{boxShadow:playing?'0 0 5px #fc8181':'none',
                    animation:playing?'vPulse 1.5s ease-in-out infinite':'none'}}/>
          <Text fontSize="9px" color={dim}>{playing?'LIVE':'PAUSED'}</Text>
          <Text fontSize="9px" color={dim}>· {ops.length} ops</Text>
          {smoothed&&<Badge fontSize="7px" bg="rgba(82,183,136,0.14)" color={accent} px={1.5} borderRadius="sm">+1.2s</Badge>}
        </Flex>
      </Flex>

      {/* Body */}
      <Flex h="calc(100vh - 50px)">

        {/* Canvas */}
        <Box flex={1} position="relative" ref={containerRef}>
          <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
            style={{width:'100%',height:'100%',display:'block',cursor:isFocusing?'crosshair':'default'}}
            onMouseDown={onMouseDown} onMouseUp={onMouseUp}
          />

          {!smoothed&&(
            <Flex position="absolute" top={3} left={0} right={0} pointerEvents="none">
              {STAGES.map(s=>{
                const Icon=s.icon;
                return (
                  <Box key={s.id} position="absolute" style={{left:`${s.x*100}%`,transform:'translateX(-50%)'}}>
                    <Flex direction="column" align="center" gap={0.5} px={2} py={1}
                      bg="rgba(13,17,23,0.84)" border={`1px solid ${border}`}
                      borderRadius="md" backdropFilter="blur(4px)"
                    >
                      <Icon size={11} color={accent}/>
                      <Text fontSize="7px" color={dim} letterSpacing="0.08em">{s.label.toUpperCase()}</Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}

          {!smoothed&&(
            <Box position="absolute" left={3} top={0} bottom={0} pointerEvents="none">
              {[
                {label:'cloud arc',  top:'18%', color:'rgba(66,153,225,0.45)' },
                {label:'outcome',    top:'41%', color:'rgba(82,183,136,0.4)'  },
                {label:'process',    top:'64%', color:'rgba(159,122,234,0.4)' },
              ].map(ch=>(
                <Text key={ch.label} fontSize="7px" letterSpacing="0.12em" color={ch.color}
                  position="absolute" style={{top:ch.top}}
                >{ch.label}</Text>
              ))}
            </Box>
          )}

          <Box position="absolute" bottom={5} left={4}>
            <Flex gap={2.5} px={3} py={2}
              bg="rgba(13,17,23,0.9)" border={`1px solid ${border}`}
              borderRadius="md" backdropFilter="blur(4px)" wrap="wrap"
            >
              {Object.entries(CODEX).map(([,e])=>(
                <Flex key={e.id} align="center" gap={1.5}>
                  <Box w={e.massClass==='jumbo'?3.5:2.5} h={e.massClass==='jumbo'?3.5:2.5}
                    borderRadius={e.morphology==='elongated'?'sm':'full'} bg={e.color}
                    style={{boxShadow:`0 0 4px ${e.color}88`}}
                  />
                  <Text fontSize="8px" color={dim}>{e.label}</Text>
                </Flex>
              ))}
              <Box w="1px" h={3} bg={border}/>
              <Flex align="center" gap={1}><Text fontSize="8px" color="rgba(246,201,14,0.6)">◎</Text><Text fontSize="8px" color={dim}>approval</Text></Flex>
              <Flex align="center" gap={1}><Text fontSize="8px" color="#4299e1">☁</Text><Text fontSize="8px" color={dim}>cloud</Text></Flex>
            </Flex>
          </Box>

          {focusRegion&&(
            <Box position="absolute" top="50%" right={4} transform="translateY(-50%)"
              bg="rgba(13,17,23,0.92)" border="1px solid rgba(66,153,225,0.32)"
              borderRadius="md" px={3} py={2} backdropFilter="blur(4px)"
            >
              <Text fontSize="8px" color="rgba(66,153,225,0.65)" letterSpacing="0.1em" mb={1}>FOCUS ACTIVE</Text>
              <Text fontSize="14px" color={bright}>{(speed*100).toFixed(0)}% speed</Text>
              <Text fontSize="8px" color={dim} mt={0.5}>{((focusRegion.x2-focusRegion.x1)*100).toFixed(0)}% of pipeline</Text>
              <Text fontSize="8px" color={dim}>satellites expanded</Text>
              <Text fontSize="8px" color={dim}>dwell shadows visible</Text>
              <Box as="button" mt={2} w="full" fontSize="8px" color="#fc8181" textAlign="center"
                onClick={clearFocus} _hover={{opacity:0.7}}>clear focus</Box>
            </Box>
          )}
        </Box>

        {/* Right panel */}
        <Box w="268px" bg={surface} borderLeft={`1px solid ${border}`}
          display="flex" flexDirection="column" overflow="hidden"
        >
          <Flex borderBottom={`1px solid ${border}`}>
            {([
              {id:'inventory',label:'Inventory',icon:IconActivity},
              {id:'anomalies',label:'Anomalies',icon:IconAlertTriangle},
              {id:'stats',    label:'Stats',    icon:IconClock},
            ] as const).map(tab=>{
              const Icon=tab.icon; const active=activePanel===tab.id;
              return (
                <Flex key={tab.id} flex={1} align="center" justify="center" gap={1}
                  py={2.5} cursor="pointer" transition="all 0.15s"
                  bg={active?'rgba(82,183,136,0.08)':'transparent'}
                  borderBottom={active?`2px solid ${accent}`:'2px solid transparent'}
                  onClick={()=>setActivePanel(tab.id)}
                >
                  <Icon size={11} color={active?accent:dim}/>
                  <Text fontSize="8px" color={active?accent:dim} letterSpacing="0.08em">
                    {tab.label.toUpperCase()}
                  </Text>
                </Flex>
              );
            })}
          </Flex>

          <Box flex={1} overflowY="auto" p={3}
            css={{'&::-webkit-scrollbar':{width:'3px'},'&::-webkit-scrollbar-thumb':{background:border}}}
          >

            {activePanel==='inventory'&&(
              <Flex direction="column" gap={2}>
                <Text fontSize="8px" color={dim} letterSpacing="0.12em" mb={1}>
                  SELF-ANNOUNCING · {INVENTORY_ITEMS.length} REGISTERED
                </Text>
                {INVENTORY_ITEMS.map(item=>(
                  <Box key={item.id} p={2.5} bg="rgba(255,255,255,0.022)"
                    border={`1px solid ${border}`} borderRadius="md" cursor="pointer"
                    _hover={{bg:'rgba(82,183,136,0.05)',borderColor:'rgba(82,183,136,0.3)'}}
                    transition="all 0.15s"
                  >
                    <Flex align="center" justify="space-between" mb={1.5}>
                      <Flex align="center" gap={1.5}>
                        <Box w={1.5} h={1.5} borderRadius="full"
                          bg={item.status==='healthy'?accent:item.status==='busy'?'#f6c90e':'#fc8181'}
                          style={{boxShadow:`0 0 4px ${item.status==='healthy'?accent:item.status==='busy'?'#f6c90e':'#fc8181'}`}}
                        />
                        <Text fontSize="11px" color={bright} fontWeight="600">{item.name}</Text>
                      </Flex>
                      <Badge fontSize="7px" px={1.5} py={0.5} borderRadius="sm" fontFamily={mono}
                        bg={item.tier==='cloud'?'rgba(66,153,225,0.11)':'rgba(82,183,136,0.09)'}
                        color={item.tier==='cloud'?'#4299e1':accent}
                        border={`1px solid ${item.tier==='cloud'?'rgba(66,153,225,0.26)':border}`}
                      >{item.tier}</Badge>
                    </Flex>
                    {item.model&&<Text fontSize="8px" color={dim} mb={1.5}>{item.model}</Text>}
                    <Flex justify="space-between">
                      <Flex direction="column">
                        <Text fontSize="7px" color={dim}>ops/hr</Text>
                        <Text fontSize="11px" color={muted}>{item.ops}</Text>
                      </Flex>
                      <Flex direction="column" align="center">
                        <Text fontSize="7px" color={dim}>type</Text>
                        <Text fontSize="9px" color={dim}>{item.type}</Text>
                      </Flex>
                      <Flex direction="column" align="flex-end">
                        <Text fontSize="7px" color={dim}>p90</Text>
                        <Text fontSize="11px"
                          color={item.latencyP90>1000?'#f6c90e':item.latencyP90>400?'rgba(246,201,14,0.5)':muted}
                        >{item.latencyP90}ms</Text>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            )}

            {activePanel==='anomalies'&&(
              <Flex direction="column" gap={2}>
                <Text fontSize="8px" color={dim} letterSpacing="0.12em" mb={1}>LAST 60s</Text>
                {ANOMALIES.map(a=>{
                  const ce=Object.values(CODEX).find(e=>e.id===a.verb);
                  return (
                    <Box key={a.id} p={2.5} borderRadius="md"
                      bg={a.severity==='error'?'rgba(252,129,129,0.055)':'rgba(246,201,14,0.045)'}
                      border={`1px solid ${a.severity==='error'?'rgba(252,129,129,0.2)':'rgba(246,201,14,0.16)'}`}
                    >
                      <Flex align="center" justify="space-between" mb={1}>
                        <Flex align="center" gap={1.5}>
                          {ce&&<Box w={2} h={2} borderRadius="full" bg={ce.color}/>}
                          <Text fontSize="10px" color={a.severity==='error'?'#fc8181':'#f6c90e'}>{a.verb}</Text>
                        </Flex>
                        <Text fontSize="8px" color={dim}>{a.time}</Text>
                      </Flex>
                      <Text fontSize="10px" color={muted} lineHeight="1.45">{a.msg}</Text>
                    </Box>
                  );
                })}
              </Flex>
            )}

            {activePanel==='stats'&&(
              <Flex direction="column">
                <Text fontSize="8px" color={dim} letterSpacing="0.12em" mb={3}>LIVE METRICS</Text>
                {[
                  {label:'Active ops',        value:ops.length,                                                  unit:''},
                  {label:'Approval waits',    value:ops.filter(o=>o.status==='approval_wait').length,            unit:''},
                  {label:'Cloud escalations', value:ops.filter(o=>o.tier==='cloud').length,                      unit:''},
                  {label:'Error state',       value:ops.filter(o=>o.status==='error').length,                    unit:''},
                  {label:'Avg latency',       value:Math.floor(ops.reduce((a,o)=>a+o.latency,0)/Math.max(ops.length,1)),unit:'ms'},
                ].map(s=>(
                  <Flex key={s.label} justify="space-between" align="baseline"
                    py={2.5} borderBottom={`1px solid ${border}`}
                  >
                    <Text fontSize="9px" color={dim}>{s.label}</Text>
                    <Flex align="baseline" gap={0.5}>
                      <Text fontSize="19px" color={bright} fontWeight="700">{s.value}</Text>
                      {s.unit&&<Text fontSize="8px" color={dim}>{s.unit}</Text>}
                    </Flex>
                  </Flex>
                ))}

                <Text fontSize="8px" color={dim} letterSpacing="0.12em" mt={4} mb={3}>BY FAMILY</Text>
                {Object.keys(FAMILY_COLORS).map(fam=>{
                  const count=ops.filter(o=>o.entry.family===fam).length;
                  const pct=ops.length?(count/ops.length)*100:0;
                  return (
                    <Box key={fam} mb={2.5}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="8px" color={dim}>{fam}</Text>
                        <Text fontSize="8px" color={muted}>{count}</Text>
                      </Flex>
                      <Box h={1} bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
                        <Box h="full" borderRadius="full" transition="width 0.6s ease"
                          style={{width:`${pct}%`,background:FAMILY_COLORS[fam],
                                  boxShadow:`0 0 4px ${FAMILY_COLORS[fam]}77`}}
                        />
                      </Box>
                    </Box>
                  );
                })}

                <Text fontSize="8px" color={dim} letterSpacing="0.12em" mt={3} mb={3}>BY VERB</Text>
                {Object.entries(CODEX).map(([,e])=>{
                  const count=ops.filter(o=>o.verb===e.id).length;
                  const pct=ops.length?(count/ops.length)*100:0;
                  return (
                    <Box key={e.id} mb={2}>
                      <Flex justify="space-between" align="center" mb={1}>
                        <Flex align="center" gap={1.5}>
                          <Box w={2} h={2} borderRadius="full" bg={e.color}/>
                          <Text fontSize="8px" color={dim}>{e.label}</Text>
                        </Flex>
                        <Text fontSize="8px" color={muted}>{count}</Text>
                      </Flex>
                      <Box h={1} bg="rgba(255,255,255,0.06)" borderRadius="full" overflow="hidden">
                        <Box h="full" borderRadius="full" transition="width 0.6s ease"
                          style={{width:`${pct}%`,background:e.color,boxShadow:`0 0 4px ${e.color}77`}}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Flex>
            )}

          </Box>
        </Box>
      </Flex>

      <style>{`
        @keyframes vPulse { 0%,100%{opacity:1} 50%{opacity:0.28} }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>
    </Box>
  );
}
