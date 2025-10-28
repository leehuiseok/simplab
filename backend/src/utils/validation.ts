import { Request, Response, NextFunction } from "express";

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return { isValid: false, message: "비밀번호는 최소 6자 이상이어야 합니다" };
  }
  return { isValid: true };
};

export const validateRequired = (
  data: any,
  requiredFields: string[]
): { isValid: boolean; missingFields?: string[] } => {
  const missingFields = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    return { isValid: false, missingFields };
  }

  return { isValid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

export const validatePagination = (page: string, limit: string) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    offset: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum)),
  };
};

// 에러 생성 함수
export const createError = (message: string, statusCode: number = 500) => {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// 비동기 핸들러 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
