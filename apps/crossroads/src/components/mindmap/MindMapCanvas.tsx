'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesDelete,
  type OnEdgesDelete,
  type OnNodeDrag,
  type Viewport,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';

import type {
  MindMapDetail,
  MindMapNode as MindMapNodeType,
  MindMapEdge as MindMapEdgeType,
  NodeCreateData,
} from '@mixtape/core/types/mindmapTypes';
import {
  useMindmapNodes,
  useMindmapEdges,
  useUpdateMindmap,
  useCreateNode,
  useCreateEdge,
  useBulkUpsertNodes,
  useBulkDeleteNodes,
  useBulkDeleteEdges,
} from '@mixtape/api/hooks/useMindmap';

import NoteNode from './nodes/NoteNode';
import LinkNode from './nodes/LinkNode';
import ImageNode from './nodes/ImageNode';
import LeafNode from './nodes/LeafNode';
import MindMapToolbar from './MindMapToolbar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, React.ComponentType<any>> = {
  note: NoteNode,
  link: LinkNode,
  image: ImageNode,
  leaf: LeafNode,
};

// Convert backend node → XYFlow node
function toFlowNode(n: MindMapNodeType): Node {
  return {
    id: n.id,
    type: n.node_type,
    position: { x: n.pos_x, y: n.pos_y },
    data: { node: n },
    ...(n.width ? { width: n.width } : {}),
    ...(n.height ? { height: n.height } : {}),
    ...(n.z_index != null ? { zIndex: n.z_index } : {}),
  };
}

// Convert backend edge → XYFlow edge
function toFlowEdge(e: MindMapEdgeType): Edge {
  return {
    id: e.id,
    source: e.source_node,
    target: e.target_node,
    type: 'default',
    label: e.label ?? undefined,
    data: { edge: e },
  };
}

interface MindMapCanvasInnerProps {
  mindmap: MindMapDetail;
}

function MindMapCanvasInner({ mindmap }: MindMapCanvasInnerProps) {
  const bgColor = useColorModeValue('#fafafa', '#1a1a2e');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  // Fetch nodes + edges in parallel
  const { data: backendNodes, isLoading: nodesLoading } = useMindmapNodes(mindmap.id);
  const { data: backendEdges, isLoading: edgesLoading } = useMindmapEdges(mindmap.id);

  // Mutations
  const updateMindmap = useUpdateMindmap(mindmap.id);
  const createNodeMut = useCreateNode(mindmap.id);
  const createEdgeMut = useCreateEdge(mindmap.id);
  const bulkUpsertNodes = useBulkUpsertNodes(mindmap.id);
  const bulkDeleteNodes = useBulkDeleteNodes(mindmap.id);
  const bulkDeleteEdges = useBulkDeleteEdges(mindmap.id);

  // XYFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dataReady, setDataReady] = useState(false);

  // Populate nodes/edges once both load
  useEffect(() => {
    if (backendNodes && backendEdges && !dataReady) {
      setNodes(backendNodes.map(toFlowNode));
      setEdges(backendEdges.map(toFlowEdge));
      setDataReady(true);
    }
  }, [backendNodes, backendEdges, dataReady, setNodes, setEdges]);

  // ---- Callbacks ----

  // Connect two nodes → create edge
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((eds) => addEdge(connection, eds));
      createEdgeMut.mutate({
        source_node: connection.source,
        target_node: connection.target,
        edge_type: 'related',
      });
    },
    [setEdges, createEdgeMut]
  );

  // Drag stop → persist positions (bulk upsert, position only, no version bump)
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, _node, draggedNodes) => {
      const items = draggedNodes.map((n: Node) => ({
        id: n.id,
        pos_x: n.position.x,
        pos_y: n.position.y,
      }));
      bulkUpsertNodes.mutate(items);
    },
    [bulkUpsertNodes]
  );

  // Delete nodes
  const onNodesDelete: OnNodesDelete = useCallback(
    (deleted) => {
      const ids = deleted.map((n) => n.id);
      bulkDeleteNodes.mutate(ids);
    },
    [bulkDeleteNodes]
  );

  // Delete edges
  const onEdgesDelete: OnEdgesDelete = useCallback(
    (deleted) => {
      const ids = deleted.map((e) => e.id);
      bulkDeleteEdges.mutate(ids);
    },
    [bulkDeleteEdges]
  );

  // Viewport change → debounced save
  const onMoveEnd = useCallback(
    (_event: unknown, viewport: Viewport) => {
      if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
      viewportDebounceRef.current = setTimeout(() => {
        updateMindmap.mutate({
          viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
        });
      }, 800);
    },
    [updateMindmap]
  );

  // Content edit from NoteNode
  const handleContentChange = useCallback(
    (nodeId: string, data: { title?: string; text?: string }) => {
      bulkUpsertNodes.mutate([{ id: nodeId, ...data }]);
    },
    [bulkUpsertNodes]
  );

  // Inject onContentChange into note node data
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((n: Node) =>
        n.type === 'note'
          ? { ...n, data: { ...n.data, onContentChange: handleContentChange } }
          : n
      ),
    [nodes, handleContentChange]
  );

  // Add node from toolbar
  const handleAddNode = useCallback(
    (data: NodeCreateData) => {
      createNodeMut.mutate(data, {
        onSuccess: (newNode) => {
          setNodes((nds: Node[]) => [...nds, toFlowNode(newNode)]);
        },
        onError: (err) => {
          console.error('Failed to create node:', err);
          alert('Failed to create node. Check console for details.');
        },
      });
    },
    [createNodeMut, setNodes]
  );

  // Title change
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      updateMindmap.mutate({ title: newTitle });
    },
    [updateMindmap]
  );

  // Loading gate
  if (nodesLoading || edgesLoading || !dataReady) {
    return (
      <VStack h="calc(100vh - 100px)" justify="center" align="center">
        <Spinner size="lg" />
        <Text fontSize="sm" color={mutedColor}>
          Loading mind map...
        </Text>
      </VStack>
    );
  }

  return (
    <Box h="calc(100vh - 48px)" display="flex" flexDirection="column">
      <MindMapToolbar
        title={mindmap.title}
        onTitleChange={handleTitleChange}
        onAddNode={handleAddNode}
      />
      <Box flex={1}>
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          defaultViewport={
            mindmap.viewport?.x != null
              ? {
                  x: mindmap.viewport.x,
                  y: mindmap.viewport.y,
                  zoom: mindmap.viewport.zoom ?? 1,
                }
              : { x: 0, y: 0, zoom: 1 }
          }
          fitView={!mindmap.viewport?.x}
          deleteKeyCode={['Backspace', 'Delete']}
          style={{ background: bgColor }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Box>
    </Box>
  );
}

// Wrap with ReactFlowProvider for useReactFlow() in toolbar
export default function MindMapCanvas({ mindmap }: { mindmap: MindMapDetail }) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner mindmap={mindmap} />
    </ReactFlowProvider>
  );
}
