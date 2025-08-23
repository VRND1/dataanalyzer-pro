import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NetworkNode, NetworkEdge } from '@/utils/analysis/network/NetworkAnalysis';

interface PositionedNode extends NetworkNode {
  x: number;
  y: number;
}

interface GraphTheoryProps {
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  width?: number;
  height?: number;
}

const NODE_RADIUS = 20;
const FONT = '14px Arial';

export function GraphTheory({ nodes = [], edges = [], width = 700, height = 500 }: GraphTheoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null);

  const positionedNodes = React.useMemo((): PositionedNode[] => {
    if (!nodes || nodes.length === 0) return [];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - NODE_RADIUS - 40;
    
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodes, width, height]);

  const findNodeById = (id: string) => positionedNodes.find(n => n.id === id);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    edges.forEach((edge, idx) => {
      const fromNode = findNodeById(edge.source);
      const toNode = findNodeById(edge.target);
      if (!fromNode || !toNode) return;

      ctx.strokeStyle = hoveredEdgeIndex === idx ? '#ff6f61' : '#999';
      ctx.lineWidth = hoveredEdgeIndex === idx ? 3 : 1.5;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();

      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText(edge.weight.toFixed(2), midX + 5, midY - 5);
    });

    positionedNodes.forEach(node => {
      ctx.fillStyle = node.id === hoveredNodeId ? '#ff6f61' : '#4287f5';
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hoveredNode = positionedNodes.find(node => {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS;
    });

    if (hoveredNode) {
      setHoveredNodeId(hoveredNode.id);
      setHoveredEdgeIndex(null);
      return;
    }

    const EDGE_HOVER_TOLERANCE = 6;

    const hoveredEdge = edges.findIndex(edge => {
      const fromNode = findNodeById(edge.source);
      const toNode = findNodeById(edge.target);
      if (!fromNode || !toNode) return false;

      const dist = pointToSegmentDistance(mouseX, mouseY, fromNode.x, fromNode.y, toNode.x, toNode.y);
      return dist < EDGE_HOVER_TOLERANCE;
    });

    if (hoveredEdge !== -1) {
      setHoveredEdgeIndex(hoveredEdge);
      setHoveredNodeId(null);
      return;
    }

    setHoveredNodeId(null);
    setHoveredEdgeIndex(null);
  };

  const pointToSegmentDistance = (
    px: number,
    py: number,
    vx: number,
    vy: number,
    wx: number,
    wy: number
  ): number => {
    const l2 = (wx - vx) ** 2 + (wy - vy) ** 2;
    if (l2 === 0) return Math.hypot(px - vx, py - vy);
    let t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = vx + t * (wx - vx);
    const projY = vy + t * (wy - vy);
    return Math.hypot(px - projX, py - projY);
  };

  useEffect(() => {
    draw();
  }, [nodes, edges, hoveredNodeId, hoveredEdgeIndex]);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Graph Theory Visualization</h2>
        <Badge variant="secondary">
          {nodes?.length || 0} Nodes & {edges?.length || 0} Edges
        </Badge>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredNodeId(null);
          setHoveredEdgeIndex(null);
        }}
      />
    </Card>
  );
}
