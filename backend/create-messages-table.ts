import { pool } from "./src/config/database";

async function createMessagesTable() {
  try {
    console.log("Creating messages table...");

    // messages 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36),
        team_id VARCHAR(36),
        content TEXT NOT NULL,
        message_type ENUM('direct', 'team') DEFAULT 'direct',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK ((receiver_id IS NOT NULL AND team_id IS NULL) OR (receiver_id IS NULL AND team_id IS NOT NULL))
      )
    `);

    console.log("✅ Messages table created successfully!");

    // 인덱스 생성 (IF NOT EXISTS는 MySQL에서 지원하지 않음)
    try {
      await pool.execute(
        `CREATE INDEX idx_messages_sender_id ON messages(sender_id)`
      );
      console.log("✅ Index idx_messages_sender_id created");
    } catch (error: any) {
      if (error.code !== "ER_DUP_KEYNAME") {
        console.log("Index idx_messages_sender_id already exists");
      }
    }

    try {
      await pool.execute(
        `CREATE INDEX idx_messages_receiver_id ON messages(receiver_id)`
      );
      console.log("✅ Index idx_messages_receiver_id created");
    } catch (error: any) {
      if (error.code !== "ER_DUP_KEYNAME") {
        console.log("Index idx_messages_receiver_id already exists");
      }
    }

    try {
      await pool.execute(
        `CREATE INDEX idx_messages_team_id ON messages(team_id)`
      );
      console.log("✅ Index idx_messages_team_id created");
    } catch (error: any) {
      if (error.code !== "ER_DUP_KEYNAME") {
        console.log("Index idx_messages_team_id already exists");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating messages table:", error);
    process.exit(1);
  }
}

createMessagesTable();
