import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 디버그: 환경변수 값 확인
console.log('🔧 Supabase URL:', supabaseUrl)
console.log('🔧 Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '없음')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  username: string
  created_at: string
  updated_at: string
}

export interface WordCategory {
  id: string
  name: string
  description: string
  order_index: number
  created_at: string
}

export interface Word {
  id: string
  word: string
  meaning: string
  pos: string // 품사
  example: string
  category_id?: string // null이면 사용자 생성 단어
  created_by?: string // null이면 기본 제공 단어
  created_at: string
  updated_at: string
}

export interface UserNetwork {
  id: string
  user_id: string
  name: string
  description?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface NetworkNode {
  id: string
  network_id: string
  word_id: string
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export interface NetworkEdge {
  id: string
  network_id: string
  source_node_id: string
  target_node_id: string
  edge_type?: string
  created_at: string
}

export interface UserLog {
  id: string
  user_id: string
  action: string
  details?: any
  created_at: string
} 