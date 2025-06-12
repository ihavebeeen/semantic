'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { useGraphContext } from '../context/GraphContext';

const NodeDetailModal = () => {
  const { isModalOpen, selectedNode, closeModal } = useGraphContext();
  console.log('NodeDetailModal 렌더링:', { isModalOpen, selectedNode, closeModal });
  
  if (!isModalOpen || !selectedNode) {
    console.log('모달 조건 불충족:', { isModalOpen, selectedNode });
    return null;
  }
  console.log('모달 렌더링 조건 통과! 포탈 생성 시도');

  if (typeof window === 'undefined' || !document.body) {
    console.log('window/document.body 없음, 모달 렌더링 불가');
    return null;
  }

  console.log('포탈로 모달 렌더링!');
  return createPortal(
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} onClick={closeModal}>
      <div style={{
        minWidth: 240,
        maxWidth: 340,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '2px solid #6366f1',
        padding: '28px 24px 20px 24px',
        zIndex: 10001,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 'bold', fontSize: 24, marginBottom: 12, color: '#3730a3' }}>{selectedNode.word}</div>
        <div style={{ marginBottom: 8, color: '#6366f1' }}>품사: {selectedNode.pos}</div>
        <div style={{ marginBottom: 8, color: '#222' }}>뜻: {selectedNode.meaning}</div>
        <div style={{ color: '#888', fontStyle: 'italic' }}>예문: {selectedNode.example}</div>
        <button style={{ marginTop: 24, padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={closeModal}>닫기</button>
      </div>
    </div>,
    document.body
  );
};

export default NodeDetailModal; 