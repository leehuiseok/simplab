import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  charset: "utf8mb4",
  timezone: "+09:00",
  connectionLimit: 10,
};

// 데이터베이스 생성용 설정 (데이터베이스명 없음)
const dbConfigWithoutDB = {
  ...dbConfig,
};

// 일반 연결용 설정 (데이터베이스명 포함)
const dbConfigWithDB = {
  ...dbConfig,
  database: process.env.DB_NAME || "simplab",
};

// Connection pool 생성 (prepared statements 비활성화)
export const pool = mysql.createPool({
  ...dbConfigWithDB,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: "utf8mb4",
  typeCast: true,
});

// 연결 시 문자셋 설정
pool.on("connection", (connection) => {
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

// 데이터베이스 생성
export const createDatabase = async (): Promise<boolean> => {
  try {
    const tempPool = mysql.createPool(dbConfigWithoutDB);
    await tempPool.execute(
      `CREATE DATABASE IF NOT EXISTS ${
        process.env.DB_NAME || "simplab"
      } CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await tempPool.end();
    console.log("✅ 데이터베이스 생성 성공");
    return true;
  } catch (error) {
    console.error("❌ 데이터베이스 생성 실패:", error);
    return false;
  }
};

// 데이터베이스 연결 테스트
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL 데이터베이스 연결 성공");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ MySQL 데이터베이스 연결 실패:", error);
    return false;
  }
};

export default pool;
