'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface GraphContextType {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectedNode: any | null;
  isModalOpen: boolean;
  openModal: (node: any) => void;
  closeModal: () => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = useCallback((node: any) => {
    console.log('openModal 호출됨:', node);
    setSelectedNode(node);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    console.log('closeModal 호출됨');
    setModalOpen(false);
    setSelectedNode(null);
  }, []);

  return (
    <GraphContext.Provider value={{ nodes, edges, setNodes, setEdges, selectedNode, isModalOpen, openModal, closeModal }}>
      {children}
    </GraphContext.Provider>
  );
};

export const useGraphContext = () => {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error('GraphContext를 GraphProvider로 감싸주세요.');
  return ctx;
};
