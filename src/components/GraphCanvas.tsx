"use client";
import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  Handle,
  Position,
  addEdge,
  Connection,
  useReactFlow,
  EdgeProps,
  getStraightPath,
  BaseEdge,
  NodeToolbar,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '@/lib/auth';

// 품사 목록
const PARTS_OF_SPEECH = [
  '명사', '동사', '형용사', '부사', '대명사', '전치사', '접속사', '감탄사',
];

// 노드 크기 상수 (뜻이 추가되어 높이 증가)
const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;

// 품사별 칩 색상 매핑
const getPosChipStyle = (pos: string) => {
  const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
    '명사': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    '동사': { bg: '#dcfce7', text: '#15803d', border: '#22c55e' },
    '형용사': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    '부사': { bg: '#fce7f3', text: '#be185d', border: '#ec4899' },
    '전치사': { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },
    '접속사': { bg: '#fed7d7', text: '#c53030', border: '#f56565' },
    '감탄사': { bg: '#e0f2fe', text: '#0891b2', border: '#06b6d4' },
  };
  
  return colorMap[pos] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
};

// 커스텀 노드 컴포넌트
const WordNode = React.memo(({ data, id }: { data: any; id: string }) => {
  const { selected } = data;
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [mouseDownPos, setMouseDownPos] = React.useState<{ x: number; y: number } | null>(null);
  
  // 마우스 다운 시 '눌림' 상태로 변경
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true);
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };
  
  // 마우스 업 시 '눌림' 상태 해제 및 클릭 처리
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPressed(false);
    if (!mouseDownPos) return;
    
    const distance = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    );
    
    // 5px 이하의 움직임은 클릭으로 처리
    if (distance <= 5) {
      // 커스텀 클릭 이벤트 발생
      const clickEvent = new CustomEvent('nodeClick', { 
        detail: { nodeId: id, nodeData: data }
      });
      window.dispatchEvent(clickEvent);
    }
    
    setMouseDownPos(null);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false); // 노드 밖으로 나가면 눌림 상태도 해제
  };

  // 상태에 따른 스타일 동적 할당 (선택 > 눌림 > 호버 > 기본)
  const borderColor = selected
    ? '#f59e0b' // 선택됨 (주황)
    : isPressed
    ? '#4f46e5' // 눌렸을 때 (진한 인디고)
    : isHovered
    ? '#818cf8' // 호버 (밝은 인디고)
    : '#6366f1'; // 기본 (인디고)

  const boxShadow = selected
    ? '0 4px 16px #f59e0b33'
    : isPressed
    ? '0 2px 12px #4f46e566' // 호버보다 살짝 강한 그림자
    : isHovered
    ? '0 2px 10px #818cf855'
    : '0 2px 8px #6366f133';

  return (
    <>
      <div
        style={{
          position: 'relative',
          background: '#fff',
          border: `2px solid ${borderColor}`,
          borderRadius: 16,
          boxShadow: boxShadow,
          padding: '12px 20px',
          minWidth: 120,
          maxWidth: 200,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
      >
        {/* 단어 */}
        <div style={{
          fontWeight: 'bold',
          fontSize: 20,
          color: '#3730a3',
          marginBottom: 4,
          lineHeight: 1.2,
        }}>
          {data.word}
        </div>
        
        {/* 뜻 */}
        <div style={{
          fontSize: 14,
          color: '#6b7280',
          fontWeight: 500,
          lineHeight: 1.3,
        }}>
          {data.meaning}
        </div>
        
        {/* 중앙 투명 핸들: 연결 받기만 가능 */}
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            opacity: 0,
            background: 'transparent',
            border: 'none',
            position: 'absolute',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          isConnectableStart={false}
          isConnectableEnd={true}
        />
        
        {/* 하단 핸들: 연결 시작만 가능 */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="source"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            width: 16,
            height: 16,
            borderRadius: 8,
            background: '#fff',
            border: '2px solid #6366f1',
            position: 'absolute',
            bottom: -8,
            zIndex: 2,
          }}
          isConnectableStart={true}
          isConnectableEnd={false}
        />
      </div>

      {/* 노드 옆에 뜨는 정보 패널 */}
      {selected && (
        <NodeToolbar 
          isVisible={selected} 
          position={Position.Right}
          style={{
            background: 'white',
            border: '2px solid #f59e0b',
            borderRadius: 12,
            padding: 16,
            minWidth: 280,
            maxWidth: 320,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1000,
            position: 'relative',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 20, color: '#f59e0b', marginBottom: 12 }}>
            {data.word}
          </div>
          
          {/* 품사 칩과 뜻을 같은 줄에 배치 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: data.example ? 16 : 20 
          }}>
            <span 
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: getPosChipStyle(data.pos).bg,
                color: getPosChipStyle(data.pos).text,
                border: `1px solid ${getPosChipStyle(data.pos).border}`,
                flexShrink: 0, // 칩이 줄어들지 않도록
              }}
            >
              {data.pos}
            </span>
            <div style={{ 
              color: '#374151', 
              fontSize: 16, 
              fontWeight: 600, 
              lineHeight: 1.4,
              flex: 1, // 나머지 공간 모두 사용
            }}>
              {data.meaning}
            </div>
          </div>
          
          {/* 예문이 있을 때만 표시 + 가로줄 구분 */}
          {data.example && (
            <>
              <div style={{ 
                height: 1, 
                backgroundColor: '#e5e7eb', 
                margin: '0 -16px 16px -16px' 
              }} />
              <div style={{ color: '#374151', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 500 }}>
                  예문
                </div>
                {data.example}
              </div>
            </>
          )}
          
          {/* 우상단 수정 아이콘 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 커스텀 이벤트로 노드 수정 요청
              const editEvent = new CustomEvent('editNode', { 
                detail: { nodeId: id, nodeData: data }
              });
              window.dispatchEvent(editEvent);
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { 
              const icon = e.currentTarget.querySelector('i');
              if (icon) icon.style.color = '#4b5563';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => { 
              const icon = e.currentTarget.querySelector('i');
              if (icon) icon.style.color = '#9ca3af';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="이 단어 수정"
          >
            <i className="fas fa-edit" style={{ fontSize: 14, color: '#9ca3af', transition: 'color 0.2s' }}></i>
          </button>
          
          {/* 우하단 삭제 아이콘 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 커스텀 이벤트로 노드 삭제 요청
              const deleteEvent = new CustomEvent('deleteNode', { 
                detail: { nodeId: id }
              });
              window.dispatchEvent(deleteEvent);
            }}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 32,
              height: 32,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => { 
              const icon = e.currentTarget.querySelector('i');
              if (icon) icon.style.color = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => { 
              const icon = e.currentTarget.querySelector('i');
              if (icon) icon.style.color = '#f87171';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="이 단어 삭제"
          >
            <i className="fas fa-trash" style={{ fontSize: 14, color: '#f87171', transition: 'color 0.2s' }}></i>
          </button>
        </NodeToolbar>
      )}
    </>
    );
  });

WordNode.displayName = 'WordNode';

// 커스텀 엣지: 노드 중앙에서 중앙으로 연결 (점선) + 삭제 버튼
const CenterToCenterEdge: React.FC<EdgeProps & { selected?: boolean; onDelete?: (id: string) => void }> = (props) => {
  const { id, source, target, markerEnd, style, selected, onDelete } = props;
  const { getNode } = useReactFlow();
  
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  
  if (!sourceNode || !targetNode) return null;
  
  // 노드 중앙 계산
  const getCenter = (node: any) => {
    const width = node.width ?? NODE_WIDTH;
    const height = node.height ?? NODE_HEIGHT;
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    };
  };
  
  const sourceCenter = getCenter(sourceNode);
  const targetCenter = getCenter(targetNode);
  
  // 중점 계산 (삭제 버튼 위치)
  const midX = (sourceCenter.x + targetCenter.x) / 2;
  const midY = (sourceCenter.y + targetCenter.y) / 2;
  
  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clickEvent = new CustomEvent('edgeClick', { 
      detail: { edgeId: id }
    });
    window.dispatchEvent(clickEvent);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🗑️ 링크 삭제 버튼 클릭:', { id, onDelete: !!onDelete });
    if (onDelete && id) {
      console.log('🗑️ 링크 삭제 실행:', id);
      onDelete(id);
    } else {
      console.error('🚨 링크 삭제 실패:', { id, onDeleteExists: !!onDelete });
    }
  };
  
  return (
    <>
      {/* 투명한 굵은 라인 - 클릭 인식 범위 확대용 */}
      <line
        x1={sourceCenter.x}
        y1={sourceCenter.y}
        x2={targetCenter.x}
        y2={targetCenter.y}
        stroke="transparent"
        strokeWidth={16} // 클릭 인식을 위한 굵은 투명 라인
        style={{ cursor: 'pointer' }}
        onClick={handleEdgeClick}
      />
      
      {/* 실제 보이는 라인 */}
      <line
        x1={sourceCenter.x}
        y1={sourceCenter.y}
        x2={targetCenter.x}
        y2={targetCenter.y}
        stroke={style?.stroke || '#6366f1'}
        strokeWidth={style?.strokeWidth || 2}
        strokeDasharray={style?.strokeDasharray || '8 4'}
        markerEnd={markerEnd}
        style={{ cursor: 'pointer', pointerEvents: 'none' }} // 투명 라인이 클릭을 처리하므로 pointerEvents 비활성화
      />
      
      {/* 선택된 경우 삭제 버튼 표시 */}
      {selected && (
        <foreignObject
          x={midX - 16}
          y={midY - 16}
          width={32}
          height={32}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={handleDeleteClick}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            −
          </div>
        </foreignObject>
      )}
    </>
  );
};

// 마커 노드 컴포넌트 - 워드 노드와 동일한 좌상단 기준 렌더링
const MarkerNode = () => (
  <div
    style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#ef4444',
      border: '2px solid #fff',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
      animation: 'pulse 2s infinite',
    }}
  />
);

// nodeTypes는 이제 컴포넌트 내부에서 메모이제이션으로 선언

// 엣지 타입을 함수로 감싸서 props 전달
const createCenterEdge = (selectedEdgeId: string | null, onDelete: (id: string) => void) => 
  (props: EdgeProps) => (
    <CenterToCenterEdge 
      {...props} 
      selected={selectedEdgeId === props.id} 
      onDelete={onDelete}
    />
  );

// edgeTypes는 컴포넌트 내부에서 동적으로 생성

const initialNodes = [
  // 음식 관련 단어들
  {
    id: '1',
    type: 'word',
    position: { x: 200, y: 200 },
    data: {
      word: 'apple',
      meaning: '사과',
      pos: '명사',
      example: 'I eat an apple every day.',
    },
  },
  {
    id: '2', 
    type: 'word',
    position: { x: 400, y: 150 },
    data: {
      word: 'sweet',
      meaning: '달콤한',
      pos: '형용사',
      example: 'This apple is very sweet.',
    },
  },
  {
    id: '3',
    type: 'word', 
    position: { x: 600, y: 200 },
    data: {
      word: 'delicious',
      meaning: '맛있는',
      pos: '형용사',
      example: 'The cake is delicious.',
    },
  },
  
  // 동작 관련 단어들
  {
    id: '4',
    type: 'word',
    position: { x: 200, y: 400 },
    data: {
      word: 'run',
      meaning: '달리다',
      pos: '동사',
      example: 'I run in the park every morning.',
    },
  },
  {
    id: '5',
    type: 'word',
    position: { x: 400, y: 450 },
    data: {
      word: 'fast',
      meaning: '빠른',
      pos: '형용사',
      example: 'He is a fast runner.',
    },
  },
  {
    id: '6',
    type: 'word',
    position: { x: 600, y: 400 },
    data: {
      word: 'quickly',
      meaning: '빠르게',
      pos: '부사',
      example: 'She runs quickly to catch the bus.',
    },
  },
  
  // 동물 관련 단어들
  {
    id: '7',
    type: 'word',
    position: { x: 100, y: 600 },
    data: {
      word: 'dog',
      meaning: '개',
      pos: '명사',
      example: 'My dog is very friendly.',
    },
  },
  {
    id: '8',
    type: 'word',
    position: { x: 300, y: 650 },
    data: {
      word: 'cat',
      meaning: '고양이',
      pos: '명사',
      example: 'The cat is sleeping on the sofa.',
    },
  },
  {
    id: '9',
    type: 'word',
    position: { x: 500, y: 600 },
    data: {
      word: 'animal',
      meaning: '동물',
      pos: '명사',
      example: 'Lions are wild animals.',
    },
  },
  
  // 감정 관련 단어들
  {
    id: '10',
    type: 'word',
    position: { x: 800, y: 300 },
    data: {
      word: 'happy',
      meaning: '행복한',
      pos: '형용사',
      example: 'I feel happy when I see you.',
    },
  },
  {
    id: '11',
    type: 'word',
    position: { x: 1000, y: 250 },
    data: {
      word: 'joy',
      meaning: '기쁨',
      pos: '명사',
      example: 'Her face was full of joy.',
    },
  },
  {
    id: '12',
    type: 'word',
    position: { x: 800, y: 500 },
    data: {
      word: 'sad',
      meaning: '슬픈',
      pos: '형용사',
      example: 'I feel sad when it rains.',
    },
  },
  
  // 자연 관련 단어들
  {
    id: '13',
    type: 'word',
    position: { x: 100, y: 100 },
    data: {
      word: 'tree',
      meaning: '나무',
      pos: '명사',
      example: 'The tree grows tall in the forest.',
    },
  },
  {
    id: '14',
    type: 'word',
    position: { x: 100, y: 300 },
    data: {
      word: 'green',
      meaning: '초록색의',
      pos: '형용사',
      example: 'The leaves are green in spring.',
    },
  },
  {
    id: '15',
    type: 'word',
    position: { x: 700, y: 100 },
    data: {
      word: 'beautiful',
      meaning: '아름다운',
      pos: '형용사',
      example: 'The sunset is beautiful.',
    },
  },
];

const initialEdges = [
  // 음식 관련 연결
  {
    id: 'e1-2',
    source: '1', // apple
    target: '2', // sweet
    type: 'center',
    style: { 
      stroke: '#6366f1', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  {
    id: 'e2-3',
    source: '2', // sweet  
    target: '3', // delicious
    type: 'center',
    style: { 
      stroke: '#6366f1', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  
  // 동작 관련 연결
  {
    id: 'e4-5',
    source: '4', // run
    target: '5', // fast
    type: 'center',
    style: { 
      stroke: '#10b981', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  {
    id: 'e5-6',
    source: '5', // fast
    target: '6', // quickly
    type: 'center',
    style: { 
      stroke: '#10b981', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  
  // 동물 관련 연결
  {
    id: 'e7-9',
    source: '7', // dog
    target: '9', // animal
    type: 'center',
    style: { 
      stroke: '#f59e0b', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  {
    id: 'e8-9',
    source: '8', // cat
    target: '9', // animal
    type: 'center',
    style: { 
      stroke: '#f59e0b', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  
  // 감정 관련 연결
  {
    id: 'e10-11',
    source: '10', // happy
    target: '11', // joy
    type: 'center',
    style: { 
      stroke: '#ec4899', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  
  // 자연 관련 연결
  {
    id: 'e1-13',
    source: '1', // apple
    target: '13', // tree
    type: 'center',
    style: { 
      stroke: '#059669', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  {
    id: 'e13-14',
    source: '13', // tree
    target: '14', // green
    type: 'center',
    style: { 
      stroke: '#059669', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  
  // 교차 연결 (의미적 관계)
  {
    id: 'e3-15',
    source: '3', // delicious
    target: '15', // beautiful
    type: 'center',
    style: { 
      stroke: '#8b5cf6', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
  {
    id: 'e15-10',
    source: '15', // beautiful
    target: '10', // happy
    type: 'center',
    style: { 
      stroke: '#8b5cf6', 
      strokeWidth: 2,
      strokeDasharray: '8 4',
    },
  },
];

// 그래프 캔버스 화면면
const GraphCanvas: React.FC = () => {
  const { user, signOut } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setCenter, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPos, setAddModalPos] = useState({ x: 300, y: 200 });
  const [clickMarker, setClickMarker] = useState<{ x: number; y: number } | null>(null);
  const [newNode, setNewNode] = useState({
    word: '',
    meaning: '',
    pos: PARTS_OF_SPEECH[0],
    example: ''
  });
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [checkedNodes, setCheckedNodes] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 단어 섹션 토글 상태
  const [sampleSectionOpen, setSampleSectionOpen] = useState(true);
  
  // 검색 관련 state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNodes, setFilteredNodes] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Array<{
    node: any;
    section: string;
    highlightedWord: string;
  }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // 호버 상태 관리
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // ReactFlow 인스턴스 가져오기
  const reactFlowInstance = useReactFlow();
  const { getNode } = reactFlowInstance;

  // 엣지 삭제 함수
  const handleDeleteEdge = useCallback((id: string) => {
    console.log('🗑️ handleDeleteEdge 호출됨:', id);
    setEdges((eds) => {
      const filteredEdges = eds.filter((e) => e.id !== id);
      console.log('🗑️ 엣지 삭제 전:', eds.length, '삭제 후:', filteredEdges.length);
      return filteredEdges;
    });
    setSelectedEdgeId(null); // 선택 해제
    console.log('🗑️ 엣지 삭제 완료, 선택 해제됨');
  }, [setEdges]);

  // 동적 엣지 타입 생성 - 메모이제이션으로 React Flow 경고 해결
  const edgeTypes: EdgeTypes = React.useMemo(() => ({
    center: createCenterEdge(selectedEdgeId, handleDeleteEdge),
  }), [selectedEdgeId, handleDeleteEdge]);

  // 노드 타입 정의 - 메모이제이션
  const nodeTypes: NodeTypes = React.useMemo(() => ({
    word: WordNode,
    marker: MarkerNode,
  }), []);

  // 커스텀 노드 클릭 처리
  const handleNodeSelection = useCallback((nodeId: string, nodeData: any) => {
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      return;
    }
    
    setSelectedNodeId(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const { x, y } = node.position;
    const nodeWidth = node.width ?? NODE_WIDTH;
    const nodeHeight = node.height ?? NODE_HEIGHT;

    setIsAnimating(true);
    setCenter(x + nodeWidth / 2, y + nodeHeight / 2, {
      zoom: 1.2,
      duration: 400,
    });
    setTimeout(() => setIsAnimating(false), 400);
  }, [selectedNodeId, setCenter, nodes]);

  // 커스텀 노드 클릭 이벤트 리스너 등록
  React.useEffect(() => {
    const handleCustomNodeClick = (event: CustomEvent) => {
      const { nodeId, nodeData } = event.detail;

      if (isAnimating) return; // 애니메이션 중에는 새 클릭 무시

      if (selectedNodeId === nodeId) {
        // 이미 선택된 노드를 다시 클릭하면 선택 해제하고 뷰를 리셋
        setSelectedNodeId(null);
        setIsAnimating(true);
        fitView({ duration: 300, padding: 0.2 });
        setTimeout(() => setIsAnimating(false), 300);
      } else {
        // 새 노드 선택
        setSelectedNodeId(nodeId);
        const node = getNode(nodeId);
        if (node) {
          const { x, y } = node.position;
          const nodeWidth = node.width ?? NODE_WIDTH;
          const nodeHeight = node.height ?? NODE_HEIGHT;

          // 화면 중앙으로 부드럽게 이동 및 확대
          setIsAnimating(true);
          setCenter(x + nodeWidth / 2, y + nodeHeight / 2, {
            zoom: 1.2,
            duration: 400,
          });
          setTimeout(() => setIsAnimating(false), 400);
        }
      }
    };

    window.addEventListener('nodeClick', handleCustomNodeClick as EventListener);
    
    return () => {
      window.removeEventListener('nodeClick', handleCustomNodeClick as EventListener);
    };
  }, [handleNodeSelection]);

  // 커스텀 엣지 클릭 이벤트 리스너 등록
  React.useEffect(() => {
    const handleCustomEdgeClick = (event: CustomEvent) => {
      const { edgeId } = event.detail;
      setSelectedEdgeId(edgeId);
      setSelectedNodeId(null); // 노드 선택 해제
    };

    const handleCustomDeleteNode = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      // 노드 삭제 로직을 직접 구현
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null); // 선택 해제
    };

    const handleCustomEditNode = (event: CustomEvent) => {
      const { nodeId, nodeData } = event.detail;
      // 수정할 노드 정보를 newNode에 설정
      setNewNode({
        word: nodeData.word,
        meaning: nodeData.meaning,
        pos: nodeData.pos,
        example: nodeData.example
      });
      // 수정 모드로 설정
      setEditingNodeId(nodeId);
      setShowAddModal(true);
    };

    window.addEventListener('edgeClick', handleCustomEdgeClick as EventListener);
    window.addEventListener('deleteNode', handleCustomDeleteNode as EventListener);
    window.addEventListener('editNode', handleCustomEditNode as EventListener);
    
    return () => {
      window.removeEventListener('edgeClick', handleCustomEdgeClick as EventListener);
      window.removeEventListener('deleteNode', handleCustomDeleteNode as EventListener);
      window.removeEventListener('editNode', handleCustomEditNode as EventListener);
    };
  }, [setNodes, setEdges]);

  // 노드 클릭 시 선택 상태 토글 + 중앙으로 이동 (ReactFlow 기본 클릭)
  const onNodeClick = useCallback((event: any, node: any) => {
    event.stopPropagation();
    handleNodeSelection(node.id, node.data);
  }, [handleNodeSelection]);

  // 엣지 클릭 시 선택
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    event.stopPropagation();
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null); // 노드 선택 해제
  }, []);

  // 캔버스 클릭 시 새 노드 추가 모달 - 정확한 캔버스 절대 좌표 계산
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    // 단어 상세 모달이 열린 상태에서 바깥 클릭 시 모달만 닫기
    if (selectedNodeId) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      return; // 새 노드 추가 모달을 띄우지 않고 종료
    }
    
    // 선택된 엣지만 해제
    setSelectedEdgeId(null);
    
    if (reactFlowInstance) {
      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      
      // 현재 뷰포트 상태 가져오기 (줌, 패닝 정보)
      const viewport = reactFlowInstance.getViewport();
      
      // 화면 클릭 좌표
      const clientX = event.clientX - bounds.left;
      const clientY = event.clientY - bounds.top;
      
      // 뷰포트 변환을 고려한 정확한 캔버스 절대 좌표 계산
      const canvasX = (clientX - viewport.x) / viewport.zoom;
      const canvasY = (clientY - viewport.y) / viewport.zoom;
      
      console.log('🖱️ 정확한 캔버스 절대 좌표 계산:', {
        clientCoords: { x: clientX, y: clientY },
        viewport: { x: viewport.x.toFixed(3), y: viewport.y.toFixed(3), zoom: viewport.zoom.toFixed(3) },
        canvasCoords: { x: canvasX.toFixed(3), y: canvasY.toFixed(3) }
      });
      
      // 정확한 캔버스 절대 좌표를 마커와 노드 생성 위치로 저장
      setClickMarker({ x: canvasX, y: canvasY });
      setAddModalPos({ x: canvasX, y: canvasY });
      
      // 모달 표시
      setShowAddModal(true);
    }
  }, [reactFlowInstance, selectedNodeId]);

  // 노드 간 연결 (중앙-중앙 + 점선 스타일)
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ 
      ...connection, 
      type: 'center', // 중앙-중앙 연결 엣지
      animated: false,
      style: { 
        stroke: '#6366f1', 
        strokeWidth: 2,
        strokeDasharray: '8 4', // 점선 패턴 (8px 선, 4px 공백)
      }
    }, eds));
  }, [setEdges]);

  // 새 노드 추가 또는 기존 노드 수정
  const handleAddNode = () => {
    if (!newNode.word || !newNode.meaning) return;
    
    if (editingNodeId) {
      // 수정 모드: 기존 노드 업데이트
      setNodes((nds) => nds.map((node) => 
        node.id === editingNodeId 
          ? { ...node, data: { ...newNode } }
          : node
      ));
      setEditingNodeId(null);
    } else {
      // 새 노드 추가 모드
      const id = (nodes.length + 1 + Math.floor(Math.random() * 10000)).toString();
      
      // clickMarker 위치를 노드의 정확한 위치로 사용 (중심점 계산 제거)
      const exactPosition = clickMarker || addModalPos;
      
      console.log('✨ 노드 생성 - 정확한 위치 적용:', { 
        clickMarker: clickMarker ? { x: clickMarker.x.toFixed(3), y: clickMarker.y.toFixed(3) } : null,
        addModalPos: { x: addModalPos.x.toFixed(3), y: addModalPos.y.toFixed(3) },
        finalPosition: { x: exactPosition.x.toFixed(3), y: exactPosition.y.toFixed(3) }
      });
      
      setNodes((nds) => ([
        ...nds,
        {
          id,
          position: { x: exactPosition.x, y: exactPosition.y }, // 클릭 좌표를 정확히 따름
          data: { ...newNode },
          type: 'word',
        },
      ]));
      
      setClickMarker(null); // 마커 제거
    }
    
    setShowAddModal(false);
    setNewNode({ word: '', meaning: '', pos: PARTS_OF_SPEECH[0], example: '' });
  };

  // 체크박스 관련 핸들러들
  const handleCheckboxToggle = useCallback((nodeId: string) => {
    setCheckedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // 검색 결과 업데이트
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = nodes
      .filter(node => node.data.word.toLowerCase().includes(query))
      .sort((a, b) => a.data.word.localeCompare(b.data.word))
      .slice(0, 5)
      .map(node => ({
        node,
        section: '샘플 단어', // 나중에 여러 섹션 생기면 동적으로 판별
        highlightedWord: highlightSearchTerm(node.data.word, searchQuery)
      }));

    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  }, [searchQuery, nodes]);

  // 검색어 하이라이팅 함수
  const highlightSearchTerm = (word: string, query: string) => {
    if (!query) return word;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return word.replace(regex, '<mark>$1</mark>');
  };

  // 검색 결과 선택 핸들러
  const handleSearchResultClick = (node: any) => {
    if (isAnimating) return;
    // 선택된 노드로 이동 및 확대
    setSelectedNodeId(node.id);
    setIsAnimating(true);
    setCenter(node.position.x + (node.width ?? NODE_WIDTH) / 2, node.position.y + (node.height ?? NODE_HEIGHT) / 2, {
      zoom: 1.5,
      duration: 400,
    });
    setTimeout(() => setIsAnimating(false), 400);
    setSearchQuery(''); // 검색창 비우기
    setFilteredNodes([]); // 목록 숨기기
  };

  // 검색창 엔터 핸들러
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0].node);
    }
  };

  const handleDeleteCheckedNodes = useCallback(() => {
    if (checkedNodes.size === 0) return;
    
    // 체크된 노드들과 관련된 엣지들 삭제
    setNodes((nds) => nds.filter((n) => !checkedNodes.has(n.id)));
    setEdges((eds) => eds.filter((e) => !checkedNodes.has(e.source) && !checkedNodes.has(e.target)));
    
    // 선택 상태 초기화
    setCheckedNodes(new Set());
    setSelectedNodeId(null);
  }, [checkedNodes, setNodes, setEdges]);

  // FAB 핸들러들
  const handleZoomIn = () => {
    reactFlowInstance.zoomTo(Math.min(zoom + 0.1, 2), { duration: 200 });
  };
  const handleZoomOut = () => {
    reactFlowInstance.zoomTo(Math.max(zoom - 0.1, 0.2), { duration: 200 });
  };
  const handleFitView = () => {
    setSelectedNodeId(null); // 선택 해제
    reactFlowInstance.fitView({ duration: 600, padding: 0.2 });
  };

  // 줌 변경 감지
  const onMove = useCallback((_: any, viewport: any) => {
    setZoom(viewport.zoom);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        mark {
          background-color: #fef3c7;
          color: #92400e;
          padding: 0;
          margin: 0;
          border-radius: 2px;
          font-weight: 700;
          font-style: normal;
          text-decoration: none;
        }
      `}</style>
      
      {/* 상단 헤더 */}
      <div style={{
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 3000,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#6366f1',
            margin: 0,
          }}>
            의미망
          </h1>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {user?.user_metadata?.username?.[0] || 
               user?.user_metadata?.name?.[0] || 
               user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{
              fontSize: 14,
              color: '#374151',
              fontWeight: 500,
            }}>
              {user?.user_metadata?.username || 
               user?.user_metadata?.name || 
               user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          
          <button
            onClick={() => signOut()}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        background: 'transparent',
        height: 'calc(100vh - 64px)', // 헤더 높이 64px 제외
        overflow: 'hidden'
      }}>
      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          left: sidebarOpen ? 312 : 12, // 사이드바 밖/안쪽 여백
          top: 88, // 헤더 높이(64px) + 여백(24px)
          width: 40,
          height: 40,
          borderRadius: 8, // 사각형으로 변경
          background: '#fff',
          color: '#6366f1',
          border: '1px solid #e5e7eb',
          fontSize: 16,
          cursor: 'pointer',
          zIndex: 4000,
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
      >
        {sidebarOpen ? '→' : '←'}
      </button>

            {/* 좌측 사이드바 */}
      <div
        style={{
          width: sidebarOpen ? 300 : 0,
          height: '100%', // 100vh에서 100%로 변경 (부모 높이에 맞춤)
          background: '#fff',
          borderRight: sidebarOpen ? '1px solid #e5e7eb' : 'none',
          transition: 'width 0.2s, padding 0.2s',
          zIndex: 2000,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sidebarOpen && (
          <>
            {/* 스크롤 가능한 리스트 영역 */}
            <div style={{
              flex: 1,
              padding: 24,
              overflowY: 'auto',
              paddingBottom: checkedNodes.size > 0 ? 100 : 24, // 삭제 버튼 공간 확보
            }}>
              <h2 style={{ color: '#6366f1', fontWeight: 800, marginBottom: 24 }}>단어 리스트</h2>
              
              {/* 검색창 */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="단어 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: '#fff',
                  }}
                  onFocusCapture={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                
                {/* 검색 결과 드롭다운 */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {searchResults.map((result, index) => (
                      <button
                        key={result.node.id}
                        onClick={() => handleSearchResultClick(result.node)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 4,
                        }}>
                          <span 
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: '#374151',
                            }}
                            dangerouslySetInnerHTML={{ __html: result.highlightedWord }}
                          />
                          <span style={{
                            fontSize: 14,
                            color: '#6b7280',
                          }}>
                            {result.node.data.meaning}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: '#9ca3af',
                        }}>
                          {result.section}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 샘플 섹션 토글 헤더 */}
              <button
                onClick={() => setSampleSectionOpen(!sampleSectionOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10b981',
                  }}></div>
                                     <span style={{
                     fontSize: 16,
                     fontWeight: 600,
                     color: '#374151',
                   }}>
                     샘플 단어
                   </span>
                 </div>
                 
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: 8,
                 }}>
                   <span style={{
                     fontSize: 14,
                     color: '#6b7280',
                     fontWeight: 500,
                   }}>
                     ({nodes.length})
                   </span>
                   <div style={{
                     fontSize: 14,
                     color: '#6b7280',
                     transform: sampleSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                     transition: 'transform 0.2s',
                   }}>
                     ▼
                   </div>
                </div>
                               </button>

              {/* 샘플 단어 리스트 (토글 가능) */}
              {sampleSectionOpen && (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  marginBottom: 20,
                  animation: 'fadeIn 0.3s ease-in-out'
                }}>
                  {nodes.map((node) => {
                    const isSelected = selectedNodeId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const isChecked = checkedNodes.has(node.id);
                    
                    console.log(`Node ${node.data.word}: selected=${isSelected}, hovered=${isHovered}`); // 디버깅용
                    
                    return (
                      <li 
                        key={node.id} 
                        style={{ 
                          marginBottom: 12, 
                          display: 'flex', 
                          alignItems: 'center', 
                          borderRadius: 8, 
                          padding: 12,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          // 직접 조건부 스타일 적용
                          background: isSelected ? '#ede9fe' : isHovered ? '#f1f5f9' : '#f8fafc',
                          border: isSelected ? '2px solid #8b5cf6' : isHovered ? '1px solid #e2e8f0' : '1px solid transparent',
                          boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.3)' : isHovered ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                          transform: isSelected ? 'translateY(0)' : isHovered ? 'translateY(-1px)' : 'translateY(0)',
                        }}
                        onMouseEnter={() => {
                          console.log(`Hovering ${node.data.word}`); // 디버깅용
                          setHoveredNodeId(node.id);
                        }}
                        onMouseLeave={() => {
                          console.log(`Leaving ${node.data.word}`); // 디버깅용
                          setHoveredNodeId(null);
                        }}
                      >
                        {/* 체크박스 - 독립적인 클릭 영역 */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckboxToggle(node.id)}
                          style={{
                            marginRight: 12,
                            transform: 'scale(1.4)',
                            cursor: 'pointer',
                            accentColor: '#ef4444',
                            opacity: 0.7,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {/* 단어 정보 - 독립적인 클릭 영역 */}
                        <div
                          style={{ 
                            flex: 1, 
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={() => handleNodeSelection(node.id, node.data)}
                        >
                          {/* 단어와 뜻을 한 줄로 */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: 12,
                          }}>
                            <span style={{
                              color: isSelected ? '#6b21a8' : '#3730a3',
                              fontSize: 18,
                              fontWeight: isSelected ? 700 : 600,
                              lineHeight: 1.2,
                              flex: 1,
                            }}>
                              {node.data.word}
                            </span>
                            
                            <span style={{
                              color: isSelected ? '#1f2937' : '#111827',
                              fontSize: 15,
                              fontWeight: isSelected ? 600 : 500,
                              lineHeight: 1.3,
                              textAlign: 'right',
                              whiteSpace: 'nowrap',
                            }}>
                              {node.data.meaning}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              
              {/* 향후 추가될 섹션들을 위한 공간 */}
              {/* 예: 수능 단어 Day1, Day2... */}
            </div>
            
            {/* 사이드바 하단 고정 삭제 버튼 */}
            {checkedNodes.size > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 100%)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid #e5e7eb',
                padding: '16px 24px 24px 24px',
                zIndex: 3000,
              }}>
                <button
                  onClick={handleDeleteCheckedNodes}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                  }}
                  title={`선택된 ${checkedNodes.size}개 단어 삭제`}
                >
                  <i className="fas fa-trash" style={{ fontSize: 12 }}></i>
                  선택된 {checkedNodes.size}개 단어 삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 메인 캔버스 */}
      <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
          nodes={[
            ...nodes.map(node => ({
              ...node,
              data: { ...node.data, selected: selectedNodeId === node.id }
            })),
            // 마커를 실제 노드로 추가 - 캔버스에 진짜로 고정됨
            ...(clickMarker ? [{
              id: 'marker',
              position: { x: clickMarker.x, y: clickMarker.y },
              data: {},
              type: 'marker',
              draggable: false,
              selectable: false,
              deletable: false,
              zIndex: 1000,
            }] : [])
          ]}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onMove={onMove}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineStyle={{
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDasharray: '8 4',
          }}
          connectionLineType={ConnectionLineType.Straight}
          fitView
          panOnDrag
          zoomOnScroll
          minZoom={0.1}
          maxZoom={3}
          deleteKeyCode={null}
          snapToGrid={false} // ReactFlow 자동 스냅 비활성화 - 정확한 위치 보장
          snapGrid={[20, 20]}
          edgesFocusable
          style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 64px)' }}
        >
          <Background 
            variant={BackgroundVariant.Lines}
            gap={20}
            color="#e2e8f0"
            lineWidth={1}
          />
        </ReactFlow>

        {/* FAB 컨트롤 */}
        <div
          style={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            zIndex: 5000,
          }}
        >
          <button 
            onClick={handleZoomIn} 
            style={{ 
              width: 48, height: 48, borderRadius: '50%', 
              background: '#6366f1', color: '#fff', border: 'none', 
              fontSize: 24, margin: 8, cursor: 'pointer' 
            }}
          >
            ＋
          </button>
          <button 
            onClick={handleZoomOut} 
            style={{ 
              width: 48, height: 48, borderRadius: '50%', 
              background: '#6366f1', color: '#fff', border: 'none', 
              fontSize: 24, margin: 8, cursor: 'pointer' 
            }}
          >
            －
          </button>
          <button 
            onClick={handleFitView} 
            style={{ 
              width: 48, height: 48, borderRadius: '50%', 
              background: '#6366f1', color: '#fff', border: 'none', 
              fontSize: 24, margin: 8, cursor: 'pointer' 
            }}
          >
            ⤢
          </button>
          <div
            style={{ 
              marginTop: 8, background: '#fff', color: '#6366f1', 
              borderRadius: 8, boxShadow: '0 2px 8px #6366f122', 
              padding: '4px 16px', fontWeight: 700, fontSize: 15, 
              minWidth: 60, textAlign: 'center' 
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
      </div>

      {/* 노드 추가 모달 */}
      {showAddModal && (
        <div
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999, 
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
                      onClick={() => {
              setShowAddModal(false);
              setClickMarker(null); // 마커 제거
              setEditingNodeId(null); // 수정 모드 초기화
              setNewNode({ word: '', meaning: '', pos: PARTS_OF_SPEECH[0], example: '' });
            }}
        >
          <div
            style={{
              background: '#fff',
              border: '2px solid #6366f1',
              borderRadius: 16,
              boxShadow: '0 8px 32px #6366f144',
              padding: 28,
              width: 320,
              maxWidth: '90vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, color: '#6366f1', marginBottom: 12, fontSize: 18 }}>
              {editingNodeId ? '단어 노드 수정' : '새 단어 노드 추가'}
            </div>
            <input
              placeholder="단어"
              value={newNode.word}
              onChange={e => setNewNode({ ...newNode, word: e.target.value })}
              style={{ 
                width: '100%', padding: 10, borderRadius: 6, 
                border: '1px solid #c7d2fe', marginBottom: 8, fontSize: 16 
              }}
              autoFocus
            />
            <input
              placeholder="뜻"
              value={newNode.meaning}
              onChange={e => setNewNode({ ...newNode, meaning: e.target.value })}
              style={{ 
                width: '100%', padding: 10, borderRadius: 6, 
                border: '1px solid #c7d2fe', marginBottom: 8, fontSize: 16 
              }}
            />
            <select
              value={newNode.pos}
              onChange={e => setNewNode({ ...newNode, pos: e.target.value })}
              style={{ 
                width: '100%', padding: 10, borderRadius: 6, 
                border: '1px solid #c7d2fe', marginBottom: 8, fontSize: 16 
              }}
            >
              {PARTS_OF_SPEECH.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              placeholder="예문 (선택)"
              value={newNode.example}
              onChange={e => setNewNode({ ...newNode, example: e.target.value })}
              style={{ 
                width: '100%', padding: 10, borderRadius: 6, 
                border: '1px solid #c7d2fe', marginBottom: 8, fontSize: 16 
              }}
            />
            <button
              onClick={handleAddNode}
              style={{ 
                width: '100%', background: '#6366f1', color: '#fff', border: 'none', 
                borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 16, 
                marginTop: 8, cursor: 'pointer' 
              }}
            >
              {editingNodeId ? '수정' : '추가'}
            </button>
            <button
              onClick={() => {
                setShowAddModal(false);
                setClickMarker(null); // 마커 제거
                setEditingNodeId(null); // 수정 모드 초기화
                setNewNode({ word: '', meaning: '', pos: PARTS_OF_SPEECH[0], example: '' });
              }}
              style={{ 
                width: '100%', background: '#e5e7eb', color: '#6366f1', border: 'none', 
                borderRadius: 8, padding: 10, fontWeight: 700, fontSize: 15, 
                marginTop: 6, cursor: 'pointer' 
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GraphCanvas;