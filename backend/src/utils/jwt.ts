import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JWTPayload } from "../types";

export const generateToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  // @ts-ignore
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};

export const generateRefreshToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  // @ts-ignore
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: "30d", // 리프레시 토큰은 30일
  });
};
