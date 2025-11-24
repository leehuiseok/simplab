import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { config } from "./config/env";
import { testConnection } from "./config/database";
import { authenticateToken, optionalAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";

// 라우터 import
import authRoutes from "./routes/auth";
import contestRoutes from "./routes/contests";
import teamRoutes from "./routes/teams";
import favoriteRoutes from "./routes/favorites";
import messageRoutes from "./routes/messages";
import profileRoutes from "./routes/profile";
import nudgeRoutes from "./routes/nudges";

// 환경변수 로드
dotenv.config();

const app = express();

// 프록시 신뢰 설정 (ngrok, load balancer 등 사용 시 필요)
app.set("trust proxy", 1);

// 보안 미들웨어
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'", "https://www.figma.com", "https://*.figma.com"],
        frameAncestors: ["'self'"],
      },
    },
  })
);

// Rate limiting (개발 환경에서는 더 관대하게 설정)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: config.nodeEnv === "production" ? 100 : 1000, // 개발환경에서는 1000번 허용
  message: {
    success: false,
    error: "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.",
  },
});
app.use("/api/", limiter);

// CORS 설정
app.use(cors(config.cors));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// 간단한 테스트 라우터
app.get("/api/test", async (req, res) => {
  try {
    const { pool } = await import("./config/database");
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM contests");
    res.json({
      success: true,
      data: { count: (rows as any[])[0].count },
      message: "데이터베이스 연결 성공",
    });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "데이터베이스 연결 실패",
    });
  }
});

// API 라우터
app.use("/api/auth", authRoutes);
app.use("/api/contests", optionalAuth, contestRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/favorites", authenticateToken, favoriteRoutes);
app.use("/api/messages", authenticateToken, messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/nudges", authenticateToken, nudgeRoutes);

// 프론트엔드 정적 파일 서빙 (프론트엔드 빌드 파일이 있으면 서빙)
// ts-node-dev로 실행 시 __dirname은 src 폴더이므로 ../../ 사용
// 빌드된 코드 실행 시 __dirname은 dist 폴더이므로 ../../../ 사용
const isCompiled = __dirname.includes("dist");
const frontendDistPath = isCompiled
  ? path.join(__dirname, "../../../frontend/dist")
  : path.join(__dirname, "../../frontend/dist");

// 프론트엔드 빌드 파일이 존재하는지 확인
const frontendExists =
  fs.existsSync(frontendDistPath) &&
  fs.existsSync(path.join(frontendDistPath, "index.html"));

if (frontendExists) {
  // 프론트엔드 정적 파일 서빙 (이미지, CSS, JS 등)
  // maxAge: 1년 캐시 (프로덕션 최적화)
  app.use(
    express.static(frontendDistPath, {
      maxAge: config.nodeEnv === "production" ? "1y" : "0",
      etag: true,
      lastModified: true,
    })
  );

  // 루트 경로 처리
  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });

  // React Router를 위한 fallback: 모든 라우트를 index.html로
  // express.static이 파일을 찾지 못한 경우에만 실행됨
  app.get("*", (req, res, next) => {
    // API 경로는 제외 (에러 핸들러로 넘김)
    if (req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }

    // 확장자가 있는 파일 요청은 404 처리 (express.static에서 찾지 못했으면)
    const hasExtension = /\.\w+$/.test(req.path.split("?")[0]);
    if (hasExtension) {
      return notFoundHandler(req, res);
    }

    // 그 외의 모든 경로는 React Router로 처리
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  // 프론트엔드 빌드 파일이 없으면 개발 모드 메시지 표시
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Simplab API 서버가 실행 중입니다.",
      endpoints: {
        health: "/health",
        api: "/api",
        docs: "프론트엔드 빌드가 필요합니다: cd frontend && npm run build",
      },
      environment: config.nodeEnv,
    });
  });
}

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error(
        "❌ 데이터베이스 연결에 실패했습니다. 서버를 시작할 수 없습니다."
      );
      process.exit(1);
    }

    // 서버 시작
    app.listen(config.port, () => {
      console.log(`
🚀 Simplab 백엔드 서버가 시작되었습니다!
📍 포트: ${config.port}
🌍 환경: ${config.nodeEnv}
📅 시간: ${new Date().toLocaleString("ko-KR")}
🔗 Health Check: http://localhost:${config.port}/health
      `);
    });
  } catch (error) {
    console.error("❌ 서버 시작 중 오류 발생:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM 신호를 받았습니다. 서버를 종료합니다...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT 신호를 받았습니다. 서버를 종료합니다...");
  process.exit(0);
});

// 서버 시작
startServer();
