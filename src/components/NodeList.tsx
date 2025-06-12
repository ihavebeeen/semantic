import React from 'react';
import NodeCard, { NodeCardProps } from './NodeCard';

export interface NodeListProps {
  nodes: NodeCardProps[];
  onEditNode?: (id: string) => void;
  onDeleteNode?: (id: string) => void;
}

const NodeList: React.FC<NodeListProps> = ({ nodes, onEditNode, onDeleteNode }) => {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <NodeCard
          key={node.word}
          {...node}
          onEdit={onEditNode ? () => onEditNode(node.word) : undefined}
          onDelete={onDeleteNode ? () => onDeleteNode(node.word) : undefined}
        />
      ))}
    </div>
  );
};

export default NodeList;