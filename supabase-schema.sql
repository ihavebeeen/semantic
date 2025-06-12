-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 정보 테이블
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 단어 카테고리 테이블 (기본 제공 단어들의 섹션)
CREATE TABLE word_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 단어 테이블 (기본 제공 + 사용자 생성)
CREATE TABLE words (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word VARCHAR(100) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  pos VARCHAR(20) NOT NULL, -- 품사
  example TEXT,
  category_id UUID REFERENCES word_categories(id) ON DELETE SET NULL, -- null이면 사용자 생성
  created_by UUID REFERENCES users(id) ON DELETE CASCADE, -- null이면 기본 제공
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자별 의미망 테이블
CREATE TABLE user_networks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 의미망의 노드들
CREATE TABLE network_nodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES user_networks(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  position_x DECIMAL(10,2) NOT NULL,
  position_y DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(network_id, word_id) -- 같은 네트워크에서 같은 단어는 한 번만
);

-- 노드들 간의 연결
CREATE TABLE network_edges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  network_id UUID NOT NULL REFERENCES user_networks(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES network_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) DEFAULT 'semantic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(network_id, source_node_id, target_node_id) -- 중복 연결 방지
);

-- 사용자 활동 로그
CREATE TABLE user_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_words_category ON words(category_id);
CREATE INDEX idx_words_created_by ON words(created_by);
CREATE INDEX idx_network_nodes_network ON network_nodes(network_id);
CREATE INDEX idx_network_nodes_word ON network_nodes(word_id);
CREATE INDEX idx_network_edges_network ON network_edges(network_id);
CREATE INDEX idx_user_logs_user ON user_logs(user_id);
CREATE INDEX idx_user_logs_created_at ON user_logs(created_at);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at 트리거 설정
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_networks_updated_at BEFORE UPDATE ON user_networks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_network_nodes_updated_at BEFORE UPDATE ON network_nodes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own networks" ON user_networks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own network nodes" ON network_nodes FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_networks WHERE id = network_id)
);
CREATE POLICY "Users can view own network edges" ON network_edges FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM user_networks WHERE id = network_id)
);
CREATE POLICY "Users can view own logs" ON user_logs FOR SELECT USING (auth.uid() = user_id);

-- 기본 제공 단어들은 모든 사용자가 읽기 가능
CREATE POLICY "Everyone can view default words" ON words FOR SELECT USING (created_by IS NULL);
-- 사용자 생성 단어는 본인만 접근 가능
CREATE POLICY "Users can manage own words" ON words FOR ALL USING (auth.uid() = created_by);

-- 카테고리는 모든 사용자가 읽기 가능
ALTER TABLE word_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view categories" ON word_categories FOR SELECT USING (true); 