-- 메시지 읽음 상태 추가 마이그레이션

-- messages 테이블에 읽음 상태 컬럼 추가
ALTER TABLE messages 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMP NULL;

-- 읽음 상태 인덱스 추가
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);

