import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JWTPayload } from "../types";

// Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: "액세스 토큰이 필요합니다",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: "유효하지 않은 토큰입니다",
    });
    return;
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
    } catch (error) {
      // 토큰이 유효하지 않아도 계속 진행
    }
  }

  next();
};
