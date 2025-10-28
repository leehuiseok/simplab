import { pool } from "./src/config/database";

const createNudgesTable = async () => {
  try {
    console.log("🔄 nudges 테이블을 생성합니다...");

    const createTableQuery = `
      CREATE TABLE nudges (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        from_user_id VARCHAR(36) NOT NULL,
        to_user_id VARCHAR(36) NOT NULL,
        contest_id VARCHAR(36),
        team_id VARCHAR(36),
        message TEXT,
        status ENUM('sent', 'read', 'responded') DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        CHECK ((contest_id IS NOT NULL AND team_id IS NULL) OR (contest_id IS NULL AND team_id IS NOT NULL))
      )
    `;

    await pool.execute(createTableQuery);
    console.log("✅ nudges 테이블 생성 완료");

    // 인덱스 생성
    const indexes = [
      "CREATE INDEX idx_nudges_from_user_id ON nudges(from_user_id)",
      "CREATE INDEX idx_nudges_to_user_id ON nudges(to_user_id)",
      "CREATE INDEX idx_nudges_contest_id ON nudges(contest_id)",
      "CREATE INDEX idx_nudges_team_id ON nudges(team_id)",
    ];

    for (const indexQuery of indexes) {
      try {
        await pool.execute(indexQuery);
        console.log(
          "✅ 인덱스 생성 완료:",
          indexQuery.substring(0, 50) + "..."
        );
      } catch (error: any) {
        if (error.code === "ER_DUP_KEYNAME") {
          console.log(
            "⚠️ 인덱스가 이미 존재합니다:",
            indexQuery.substring(0, 50) + "..."
          );
        } else {
          throw error;
        }
      }
    }

    console.log("🎉 nudges 테이블 및 인덱스 생성이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 테이블 생성 중 오류 발생:", error);
    throw error;
  } finally {
    await pool.end();
  }
};

createNudgesTable()
  .then(() => {
    console.log("완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("실패:", error);
    process.exit(1);
  });
