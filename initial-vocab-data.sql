-- 의미망 애플리케이션 단어 데이터 초기화

-- 카테고리 생성
INSERT INTO word_categories (id, name, description, order_index) VALUES
  (gen_random_uuid(), '초등 단어', '초등학교 수준 영어 단어 (1)', 1),
  (gen_random_uuid(), '중고등 단어', '중고등학교 수준 영어 단어 (2)', 2),
  (gen_random_uuid(), '고급 단어', '고급/대학 수준 영어 단어 (0)', 3);
