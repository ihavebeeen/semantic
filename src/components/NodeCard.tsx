import React from 'react';

export interface NodeCardProps {
  word: string;
  meaning: string;
  example?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ word, meaning, example, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded shadow p-4 mb-2">
      <div className="font-bold text-lg">{word}</div>
      <div className="text-gray-600 mb-1">{meaning}</div>
      {example && <div className="text-sm text-gray-400 italic">{example}</div>}
      <div className="mt-2 flex gap-2">
        {onEdit && <button className="text-blue-500" onClick={onEdit}>수정</button>}
        {onDelete && <button className="text-red-500" onClick={onDelete}>삭제</button>}
      </div>
    </div>
  );
};

export default NodeCard;