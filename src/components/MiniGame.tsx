import React from 'react';

export interface MiniGameProps {
  nodes: any[];
  onResult?: (result: any) => void;
}

const MiniGame: React.FC<MiniGameProps> = ({ nodes, onResult }) => {
  return (
    <div className="p-4 bg-yellow-50 rounded shadow">
      <div className="font-bold mb-2">미니게임 (구현 예정)</div>
      <div className="text-gray-500">여기에 미니게임 UI가 들어갑니다.</div>
    </div>
  );
};

export default MiniGame;