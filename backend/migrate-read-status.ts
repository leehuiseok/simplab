import { pool } from "./src/config/database.js";

async function runMigration() {
  try {
    console.log("🔄 메시지 읽음 상태 컬럼 추가 중...");

    // is_read 컬럼 추가
    await pool.execute(`
      ALTER TABLE messages 
      ADD COLUMN is_read BOOLEAN DEFAULT FALSE
    `);
    console.log("✅ is_read 컬럼 추가 완료");

    // read_at 컬럼 추가
    await pool.execute(`
      ALTER TABLE messages 
      ADD COLUMN read_at TIMESTAMP NULL
    `);
    console.log("✅ read_at 컬럼 추가 완료");

    // 인덱스 추가
    await pool.execute(`
      CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read)
    `);
    console.log("✅ 읽음 상태 인덱스 추가 완료");

    await pool.execute(`
      CREATE INDEX idx_messages_created_at ON messages(created_at)
    `);
    console.log("✅ 생성 시간 인덱스 추가 완료");

    console.log("🎉 마이그레이션 완료!");
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
