import { supabase } from '@/lib/supabase'
import type { Word, NetworkNode, NetworkEdge, UserNetwork } from '@/lib/supabase'

// 단어 관련 서비스
export class WordService {
  // 모든 단어 가져오기 (기본 제공 + 사용자 생성)
  static async getAllWords() {
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        word_categories(name, description)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // 사용자 생성 단어만 가져오기
  static async getUserWords(userId: string) {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // 새 단어 생성
  static async createWord(word: Omit<Word, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('words')
      .insert([word])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 단어 삭제
  static async deleteWord(wordId: string) {
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId)
    
    if (error) throw error
  }

  // 단어 업데이트
  static async updateWord(wordId: string, updates: Partial<Word>) {
    const { data, error } = await supabase
      .from('words')
      .update(updates)
      .eq('id', wordId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 네트워크 관련 서비스
export class NetworkService {
  // 사용자의 기본 네트워크 가져오기
  static async getDefaultNetwork(userId: string) {
    const { data, error } = await supabase
      .from('user_networks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()
    
    if (error) {
      // 기본 네트워크가 없으면 생성
      if (error.code === 'PGRST116') {
        return this.createDefaultNetwork(userId)
      }
      throw error
    }
    return data
  }

  // 기본 네트워크 생성
  static async createDefaultNetwork(userId: string) {
    const { data, error } = await supabase
      .from('user_networks')
      .insert([{
        user_id: userId,
        name: '내 의미망',
        description: '기본 의미망',
        is_default: true
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 네트워크의 노드들 가져오기
  static async getNetworkNodes(networkId: string) {
    const { data, error } = await supabase
      .from('network_nodes')
      .select(`
        *,
        words(*)
      `)
      .eq('network_id', networkId)
    
    if (error) throw error
    return data
  }

  // 네트워크의 엣지들 가져오기
  static async getNetworkEdges(networkId: string) {
    const { data, error } = await supabase
      .from('network_edges')
      .select('*')
      .eq('network_id', networkId)
    
    if (error) throw error
    return data
  }

  // 노드 추가
  static async addNode(node: Omit<NetworkNode, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('network_nodes')
      .insert([node])
      .select(`
        *,
        words(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  // 노드 위치 업데이트
  static async updateNodePosition(nodeId: string, x: number, y: number) {
    const { data, error } = await supabase
      .from('network_nodes')
      .update({ position_x: x, position_y: y })
      .eq('id', nodeId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 노드 삭제
  static async deleteNode(nodeId: string) {
    const { error } = await supabase
      .from('network_nodes')
      .delete()
      .eq('id', nodeId)
    
    if (error) throw error
  }

  // 여러 노드 삭제
  static async deleteNodes(nodeIds: string[]) {
    const { error } = await supabase
      .from('network_nodes')
      .delete()
      .in('id', nodeIds)
    
    if (error) throw error
  }

  // 엣지 추가
  static async addEdge(edge: Omit<NetworkEdge, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('network_edges')
      .insert([edge])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 엣지 삭제
  static async deleteEdge(edgeId: string) {
    const { error } = await supabase
      .from('network_edges')
      .delete()
      .eq('id', edgeId)
    
    if (error) throw error
  }
}

// 사용자 로그 서비스
export class LogService {
  static async logAction(action: string, details?: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_logs')
      .insert([{
        user_id: user.id,
        action,
        details
      }])
    
    if (error) console.error('Failed to log action:', error)
  }
} 