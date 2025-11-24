import dotenv from "dotenv";

dotenv.config();

export const config = {
  // 서버 설정
  port: parseInt(process.env.PORT || "4000"),
  nodeEnv: process.env.NODE_ENV || "development",

  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "simplab",
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret_key_here",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // CORS 설정
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
          ) => {
            // 개발 환경: localhost와 ngrok 도메인 허용
            if (!origin) {
              return callback(null, true);
            }
            const allowedOrigins = [
              /^http:\/\/localhost:\d+$/,
              /^https:\/\/.*\.ngrok-free\.dev$/,
              /^https:\/\/.*\.ngrok\.io$/,
              /^https:\/\/.*\.ngrok-app\.com$/,
            ];
            const isAllowed = allowedOrigins.some((pattern) =>
              pattern.test(origin)
            );
            callback(null, isAllowed);
          },
    credentials: true,
  },
};

// 필수 환경변수 검증
const requiredEnvVars = ["DB_PASSWORD", "JWT_SECRET"];

if (config.nodeEnv === "production") {
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    console.error(
      "❌ 필수 환경변수가 설정되지 않았습니다:",
      missingVars.join(", ")
    );
    process.exit(1);
  }
}

export default config;
