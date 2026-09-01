"use client";

import { useState, useMemo, useRef } from "react";
import { Box, Flex, Text, Button, Input } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  INITIAL_MOIETIES, SEED_LIKENESSES, RELATIONS,
  type Moiety, type LikenessRecord, type Formation,
} from "./fieldData";
import { FieldCanvas } from "./FieldCanvas";
import { MoietyEnvelope } from "./MoietyEnvelope";
import { AssemblyWorkbench } from "./AssemblyWorkbench";
import { LikenessModal } from "./LikenessModal";

const CANVAS_W = 1800;
const CANVAS_H = 1100;
interface FieldSurfaceProps {
  groupSlug: string;
}

export function FieldSurface({ groupSlug: _ }: FieldSurfaceProps) {
  const bgColor = useColorModeValue("white", "gray.900");
  const panelBg = useColorModeValue("white", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const toolbarBg = useColorModeValue("gray.50", "gray.900");
  const [moieties, setMoieties] = useState<Moiety[]>(() => INITIAL_MOIETIES);
  const [likenesses, setLikenesses] = useState<LikenessRecord[]>(SEED_LIKENESSES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [standInId, setStandInId] = useState<string | null>(null);
  const [granularity, setGranularity] = useState(50);
  const [quantity, setQuantity] = useState(24);
  const [findQuery, setFindQuery] = useState("");
  const [findHitIds, setFindHitIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [softSnap, setSoftSnap] = useState(false);
  const [assemblyOpen, setAssemblyOpen] = useState(false);
  const [likenessModalOpen, setLikenessModalOpen] = useState(false);
  const [showLines, setShowLines] = useState(true);
  const findClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moietyMap = useMemo(() => new Map(moieties.map(m => [m.id, m])), [moieties]);

  const effectiveGravity = useMemo((): Map<string, number> => {
    const map = new Map<string, number>();
    for (const m of moieties) {
      let g = m.gravity;
      if (standInId && standInId !== m.id) {
        const si = moietyMap.get(standInId);
        if (si && (si.relations.includes(m.id) || m.relations.includes(standInId))) {
          g = Math.min(100, g + 20);
        }
      }
      map.set(m.id, g);
    }
    return map;
  }, [moieties, standInId, moietyMap]);

  const visibleIds = useMemo((): Set<string> => {
    const sorted = [...moieties]
      .map(m => ({ id: m.id, g: effectiveGravity.get(m.id) ?? m.gravity }))
      .sort((a, b) => b.g - a.g);
    const ids = new Set(sorted.slice(0, quantity).map(s => s.id));
    for (const id of findHitIds) ids.add(id);
    return ids;
  }, [moieties, quantity, effectiveGravity, findHitIds]);

  function update(id: string, patch: Partial<Moiety>) {
    setMoieties(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  function handleFind() {
    if (findClearRef.current) clearTimeout(findClearRef.current);
    const q = findQuery.trim().toLowerCase();
    if (!q) { setFindHitIds(new Set()); return; }
    const hits = moieties
      .filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.distillate.toLowerCase().includes(q) ||
        m.tags.some(t => t.includes(q))
      )
      .map(m => m.id);
    setFindHitIds(new Set(hits));
    findClearRef.current = setTimeout(() => setFindHitIds(new Set()), 2000);
  }

  function handleSelectMoiety(id: string) {
    if (selectMode) {
      setSelectedSet(prev => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
    } else {
      setSelectedId(prev => prev === id ? null : id);
    }
  }

  function handleMoveMoiety(id: string, x: number, y: number, humanPlaced: boolean) {
    update(id, { x, y, human_placed: humanPlaced });
  }

  function handleIncreaseGravity(id: string) {
    const m = moietyMap.get(id);
    if (m) update(id, { gravity: Math.min(100, m.gravity + 10) });
  }

  function handleLetDrift(id: string) {
    const m = moietyMap.get(id);
    if (m) update(id, { gravity: Math.max(0, m.gravity - 15) });
  }

  function handleRestorePosition(id: string) {
    const m = moietyMap.get(id);
    if (m) update(id, { x: m.home_x, y: m.home_y, human_placed: false });
  }

  function handleNudge(id: string, dx: number, dy: number) {
    const m = moietyMap.get(id);
    if (!m) return;
    update(id, {
      x: Math.max(0, Math.min(CANVAS_W - 140, m.x + dx)),
      y: Math.max(0, Math.min(CANVAS_H - 80, m.y + dy)),
      human_placed: true,
    });
  }

  function handleGentlyTidy() {
    setMoieties(prev => prev.map(m => {
      if (m.human_placed) return m;
      const dx = m.home_x - m.x;
      const dy = m.home_y - m.y;
      return { ...m, x: m.x + dx * 0.3, y: m.y + dy * 0.3 };
    }));
  }

  function handleCreateLikeness(name: string, formation: Formation, memberIds: string[]) {
    const id = `like-${Date.now()}`;
    setLikenesses(prev => [...prev, { id, name, formation, memberIds }]);
    setMoieties(prev => prev.map(m =>
      memberIds.includes(m.id) ? { ...m, likenesses: [...m.likenesses, id] } : m
    ));
    settleFormation(memberIds, formation);
    setLikenessModalOpen(false);
    setSelectMode(false);
    setSelectedSet(new Set());
  }

  function settleFormation(memberIds: string[], formation: Formation) {
    const members = moieties.filter(m => memberIds.includes(m.id));
    if (members.length === 0) return;
    const cx = members.reduce((s, m) => s + m.x, 0) / members.length;
    const cy = members.reduce((s, m) => s + m.y, 0) / members.length;

    setMoieties(prev => prev.map(m => {
      if (!memberIds.includes(m.id) || m.human_placed) return m;
      const idx = memberIds.indexOf(m.id);
      const count = memberIds.length;
      let nx: number, ny: number;

      if (formation === "circle") {
        const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
        const r = Math.max(130, count * 28);
        nx = cx + r * Math.cos(angle);
        ny = cy + r * Math.sin(angle);
      } else if (formation === "row") {
        nx = cx - (count * 155) / 2 + idx * 155;
        ny = cy;
      } else {
        const cols = Math.ceil(Math.sqrt(count));
        nx = cx - (cols * 145) / 2 + (idx % cols) * 145;
        ny = cy - (Math.ceil(count / cols) * 85) / 2 + Math.floor(idx / cols) * 85;
      }

      return {
        ...m,
        x: Math.max(10, Math.min(CANVAS_W - 145, nx)),
        y: Math.max(10, Math.min(CANVAS_H - 75, ny)),
      };
    }));
  }

  const granLabel = granularity < 33 ? "Big Picture" : granularity < 67 ? "Medium" : "Details";
  const selectedMoiety = selectedId ? (moietyMap.get(selectedId) ?? null) : null;

  return (
    <>
      <style>{`
        @keyframes field-beat {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.9); }
          60%  { box-shadow: 0 0 0 18px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        .is-find-beat { animation: field-beat 1.75s ease-out; }
      `}</style>

      <Box display="flex" flexDirection="column" h="100vh" overflow="hidden" bg={bgColor}>

        {/* Toolbar */}
        <Flex
          px={4} py={2} align="center" gap={3} flexWrap="wrap"
          borderBottomWidth="1px" borderColor={borderColor}
          bg={toolbarBg} flexShrink={0}
        >
          <Text fontSize="xs" fontWeight="700" color={headingColor} letterSpacing="wider" textTransform="uppercase" flexShrink={0}>
            Working Field
          </Text>

          {/* Granularity */}
          <Flex align="center" gap={2} flexShrink={0}>
            <Text fontSize="xs" color={labelColor} w="70px">
              {granLabel}
            </Text>
            <input
              type="range" min={0} max={100} value={granularity}
              onChange={e => setGranularity(Number(e.target.value))}
              style={{ width: "100px", accentColor: "#6366F1" }}
              title="Granularity: Big Picture → Details"
            />
          </Flex>

          {/* Quantity */}
          <Flex align="center" gap={2} flexShrink={0}>
            <Text fontSize="xs" color={labelColor}>{quantity} visible</Text>
            <input
              type="range" min={10} max={40} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              style={{ width: "80px", accentColor: "#6366F1" }}
              title="Quantity: how many moieties are visible"
            />
          </Flex>

          {/* Find */}
          <Flex align="center" gap={1} flexShrink={0}>
            <Input
              size="xs"
              placeholder="Find…"
              value={findQuery}
              onChange={e => setFindQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFind()}
              w="140px"
            />
            <Button size="xs" variant="outline" onClick={handleFind} colorPalette="indigo">
              Find
            </Button>
          </Flex>

          <Box w="1px" h="20px" bg={borderColor} flexShrink={0} />

          {/* Select mode */}
          <Button
            size="xs"
            variant={selectMode ? "solid" : "outline"}
            colorPalette={selectMode ? "amber" : undefined}
            onClick={() => { setSelectMode(v => !v); setSelectedSet(new Set()); }}
            flexShrink={0}
          >
            {selectMode ? `Select (${selectedSet.size})` : "Select pieces"}
          </Button>

          {selectMode && selectedSet.size > 0 && (
            <>
              <Button size="xs" colorPalette="indigo" variant="outline" onClick={() => setLikenessModalOpen(true)}>
                Create Likeness
              </Button>
              <Button size="xs" colorPalette="green" onClick={() => setAssemblyOpen(true)}>
                Assemble →
              </Button>
            </>
          )}

          <Box w="1px" h="20px" bg={borderColor} flexShrink={0} />

          <Button size="xs" variant="ghost" onClick={handleGentlyTidy} flexShrink={0}>
            Gently tidy
          </Button>

          <Button
            size="xs"
            variant={softSnap ? "solid" : "ghost"}
            colorPalette={softSnap ? "indigo" : undefined}
            onClick={() => setSoftSnap(v => !v)}
            flexShrink={0}
          >
            Soft snap
          </Button>

          <Button
            size="xs"
            variant={showLines ? "solid" : "ghost"}
            colorPalette={showLines ? "indigo" : undefined}
            onClick={() => setShowLines(v => !v)}
            flexShrink={0}
          >
            Lines
          </Button>

          {standInId && (
            <Button size="xs" variant="solid" colorPalette="indigo" onClick={() => setStandInId(null)}>
              Exit: {moietyMap.get(standInId)?.name ?? standInId}
            </Button>
          )}
        </Flex>

        {/* Main area */}
        <Flex flex={1} overflow="hidden">

          {/* Scrollable canvas */}
          <Box flex={1} overflow="auto">
            <FieldCanvas
              moieties={moieties}
              likenesses={likenesses}
              relations={RELATIONS}
              visibleIds={visibleIds}
              selectedId={selectedId}
              standInId={standInId}
              granularity={granularity}
              softSnap={softSnap}
              selectMode={selectMode}
              selectedSet={selectedSet}
              findHitIds={findHitIds}
              effectiveGravity={effectiveGravity}
              showLines={showLines}
              onMoveMoiety={handleMoveMoiety}
              onSelectMoiety={handleSelectMoiety}
            />
          </Box>

          {/* Envelope panel */}
          {selectedMoiety && !selectMode && (
            <Box
              w="300px"
              flexShrink={0}
              borderLeftWidth="1px"
              borderColor={borderColor}
              bg={panelBg}
              overflowY="auto"
            >
              <MoietyEnvelope
                moiety={selectedMoiety}
                likenesses={likenesses}
                effectiveGravity={effectiveGravity.get(selectedMoiety.id) ?? selectedMoiety.gravity}
                standInId={standInId}
                onClose={() => setSelectedId(null)}
                onIncreaseGravity={handleIncreaseGravity}
                onLetDrift={handleLetDrift}
                onRestorePosition={handleRestorePosition}
                onNudge={handleNudge}
                onStandIn={(id) => setStandInId(prev => prev === id ? null : id)}
              />
            </Box>
          )}
        </Flex>
      </Box>

      {/* Assembly workbench */}
      {assemblyOpen && (
        <AssemblyWorkbench
          selectedIds={[...selectedSet]}
          moieties={moieties}
          onClose={() => setAssemblyOpen(false)}
        />
      )}

      {/* Likeness modal */}
      {likenessModalOpen && (
        <LikenessModal
          selectedIds={[...selectedSet]}
          moieties={moieties}
          onConfirm={handleCreateLikeness}
          onCancel={() => setLikenessModalOpen(false)}
        />
      )}
    </>
  );
}
