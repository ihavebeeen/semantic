'use client';
import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import GraphCanvas from '../components/GraphCanvas';
import { GraphProvider } from '../context/GraphContext';
import { useAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 로딩 중일 때
  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: '#6b7280', fontSize: 16 }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 상태
  if (!user) {
    return (
      <>
        <div style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          textAlign: 'center',
          padding: 20,
        }}>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{
              fontSize: 48,
              fontWeight: 700,
              marginBottom: 16,
              background: 'linear-gradient(45deg, #fff, #e0e7ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              의미망
            </h1>
            <p style={{
              fontSize: 20,
              color: '#e0e7ff',
              marginBottom: 32,
              maxWidth: 500,
              lineHeight: 1.6,
            }}>
              단어들의 연결고리를 시각화하고<br />
              의미의 네트워크를 탐험해보세요
            </p>
            
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                padding: '16px 32px',
                background: '#fff',
                color: '#6366f1',
                border: 'none',
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
              }}
            >
              시작하기
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: 48,
            maxWidth: 800,
            marginTop: 64,
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <i className="fas fa-project-diagram" style={{ fontSize: 24 }}></i>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                시각화
              </h3>
              <p style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.6 }}>
                단어와 의미를 노드와 연결선으로<br />
                직관적으로 표현합니다
              </p>
            </div>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <i className="fas fa-brain" style={{ fontSize: 24 }}></i>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                학습
              </h3>
              <p style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.6 }}>
                언어의 구조와 관계를<br />
                탐색하며 이해를 넓힙니다
              </p>
            </div>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <i className="fas fa-users" style={{ fontSize: 24 }}></i>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                공유
              </h3>
              <p style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.6 }}>
                나만의 의미망을 만들고<br />
                다른 사람들과 공유합니다
              </p>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </>
    );
  }

  // 로그인된 상태 - 메인 앱
  return (
    <GraphProvider>
      <ReactFlowProvider>
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          minHeight: '100vh',
          minWidth: 0, 
          padding: 0, 
          margin: 0, 
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0
        }}>
          <GraphCanvas />
        </div>
      </ReactFlowProvider>
    </GraphProvider>
  );
}

// CSS 애니메이션을 위한 스타일 추가
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}