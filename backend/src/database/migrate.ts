import fs from "fs";
import path from "path";
import { pool, createDatabase } from "../config/database";

const runMigration = async () => {
  try {
    console.log("🔄 데이터베이스 마이그레이션을 시작합니다...");

    // 데이터베이스 생성
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      throw new Error("데이터베이스 생성에 실패했습니다");
    }

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // SQL 문장들을 분리 (세미콜론으로 구분)
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    // CREATE TABLE 문장들을 먼저 실행
    const createTableStatements = statements.filter((stmt) =>
      stmt.toUpperCase().startsWith("CREATE TABLE")
    );

    // 인덱스 생성 문장들을 나중에 실행
    const indexStatements = statements.filter((stmt) =>
      stmt.toUpperCase().startsWith("CREATE INDEX")
    );

    // 테이블 생성
    for (const statement of createTableStatements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log(
            "✅ 테이블 생성 완료:",
            statement.substring(0, 50) + "..."
          );
        } catch (error: any) {
          if (error.code === "ER_TABLE_EXISTS_ERROR") {
            console.log(
              "⚠️ 테이블이 이미 존재합니다:",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    // 인덱스 생성
    for (const statement of indexStatements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
          console.log(
            "✅ 인덱스 생성 완료:",
            statement.substring(0, 50) + "..."
          );
        } catch (error: any) {
          if (error.code === "ER_DUP_KEYNAME") {
            console.log(
              "⚠️ 인덱스가 이미 존재합니다:",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    // 기존 테이블에 github_url 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute(
        "ALTER TABLE users ADD COLUMN github_url VARCHAR(500)"
      );
      console.log("✅ github_url 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ github_url 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    // 기존 테이블에 figma_url 컬럼 추가 (이미 존재하면 무시)
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN figma_url VARCHAR(500)");
      console.log("✅ figma_url 컬럼 추가 완료");
    } catch (error: any) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️ figma_url 컬럼이 이미 존재합니다");
      } else {
        throw error;
      }
    }

    console.log("🎉 데이터베이스 마이그레이션이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await pool.end();
  }
};

// 스크립트로 직접 실행된 경우
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("마이그레이션 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("마이그레이션 실패:", error);
      process.exit(1);
    });
}

export default runMigration;
