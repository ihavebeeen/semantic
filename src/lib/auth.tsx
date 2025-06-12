'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 임시: UI 테스트를 위해 Supabase 연결 건너뛰기
    const testMode = false; // 이 값을 false로 바꾸면 실제 Supabase 연결 시도
    
    if (testMode) {
      console.log('🧪 테스트 모드: Supabase 연결 건너뛰기');
      setUser(null);
      setLoading(false);
      return;
    }

    // 현재 세션 확인 - 에러 핸들링 추가
    const getSession = async () => {
      try {
        console.log('🔗 Supabase 연결 시도...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('✅ Supabase 연결 성공:', session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('❌ Supabase 연결 오류:', error);
        // 에러가 나도 로딩을 중단하고 로그인하지 않은 상태로 처리
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 인증 상태 변화 리스너 - 에러 핸들링 추가
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null);
          
          // 구글 로그인 등으로 새 사용자가 생성된 경우 users 테이블에 추가
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .single();

              if (!existingUser) {
                await supabase
                  .from('users')
                  .insert([{
                    id: session.user.id,
                    email: session.user.email!,
                    username: session.user.user_metadata.username || 
                             session.user.user_metadata.name ||
                             session.user.email?.split('@')[0] || 
                             'User',
                  }]);
              }
            } catch (error) {
              console.error('사용자 프로필 생성 오류:', error);
            }
          }
          
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Supabase auth listener 오류:', error);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 