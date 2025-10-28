import { Router, Request, Response } from "express";
import { pool } from "../config/database";
import { asyncHandler, createError } from "../middleware/error";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// 찔러보기 전송
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { fromUserId, toUserId, contestId, teamId, message } = req.body;
    const userId = req.user?.userId;

    // 본인에게는 찔러보기 불가
    if (fromUserId === toUserId) {
      throw createError("본인에게는 찔러보기를 보낼 수 없습니다.", 400);
    }

    // 인증된 사용자와 요청자가 일치하는지 확인
    if (userId !== fromUserId) {
      throw createError("권한이 없습니다.", 403);
    }

    // 필수 필드 검증
    if (!fromUserId || !toUserId || !message) {
      throw createError("필수 필드가 누락되었습니다.", 400);
    }

    // contestId 또는 teamId 중 하나는 반드시 있어야 함
    if (!contestId && !teamId) {
      throw createError("공모전 또는 팀 정보가 필요합니다.", 400);
    }

    // 사용자 존재 여부 확인
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [
      toUserId,
    ]);
    if ((userRows as any[]).length === 0) {
      throw createError("대상 사용자를 찾을 수 없습니다.", 404);
    }

    // 공모전 또는 팀 존재 여부 확인
    if (contestId) {
      const [contestRows] = await pool.execute(
        "SELECT id FROM contests WHERE id = ?",
        [contestId]
      );
      if ((contestRows as any[]).length === 0) {
        throw createError("공모전을 찾을 수 없습니다.", 404);
      }
    }

    if (teamId) {
      const [teamRows] = await pool.execute(
        "SELECT id FROM teams WHERE id = ?",
        [teamId]
      );
      if ((teamRows as any[]).length === 0) {
        throw createError("팀을 찾을 수 없습니다.", 404);
      }
    }

    // 찔러보기 생성
    const insertQuery = `
      INSERT INTO nudges (from_user_id, to_user_id, contest_id, team_id, message, status)
      VALUES (?, ?, ?, ?, ?, 'sent')
    `;

    const [result] = await pool.execute(insertQuery, [
      fromUserId,
      toUserId,
      contestId || null,
      teamId || null,
      message,
    ]);

    const nudgeId = (result as any).insertId;

    // 생성된 찔러보기 정보 조회
    const [nudgeRows] = await pool.execute(
      `SELECT 
        n.id,
        n.from_user_id,
        n.to_user_id,
        n.contest_id,
        n.team_id,
        n.message,
        n.status,
        n.created_at,
        from_user.name as from_user_name,
        to_user.name as to_user_name,
        c.title as contest_title,
        t.name as team_name
      FROM nudges n
      LEFT JOIN users from_user ON n.from_user_id = from_user.id
      LEFT JOIN users to_user ON n.to_user_id = to_user.id
      LEFT JOIN contests c ON n.contest_id = c.id
      LEFT JOIN teams t ON n.team_id = t.id
      WHERE n.id = ?`,
      [nudgeId]
    );

    const nudge = (nudgeRows as any[])[0];

    res.status(201).json({
      success: true,
      data: { nudge },
      message: "찔러보기를 성공적으로 보냈습니다.",
    });
  })
);

// 받은 찔러보기 목록 조회
router.get(
  "/received",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // 받은 찔러보기 목록 조회
    const query = `
      SELECT 
        n.id,
        n.from_user_id,
        n.to_user_id,
        n.contest_id,
        n.team_id,
        n.message,
        n.status,
        n.created_at,
        from_user.name as from_user_name,
        from_user.email as from_user_email,
        from_user.region as from_user_region,
        from_user.job_field as from_user_job_field,
        c.title as contest_title,
        t.name as team_name
      FROM nudges n
      LEFT JOIN users from_user ON n.from_user_id = from_user.id
      LEFT JOIN users to_user ON n.to_user_id = to_user.id
      LEFT JOIN contests c ON n.contest_id = c.id
      LEFT JOIN teams t ON n.team_id = t.id
      WHERE n.to_user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, limitNum, offset]);

    // 전체 개수 조회
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM nudges WHERE to_user_id = ?",
      [userId]
    );
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        nudges: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  })
);

// 보낸 찔러보기 목록 조회
router.get(
  "/sent",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // 보낸 찔러보기 목록 조회
    const query = `
      SELECT 
        n.id,
        n.from_user_id,
        n.to_user_id,
        n.contest_id,
        n.team_id,
        n.message,
        n.status,
        n.created_at,
        to_user.name as to_user_name,
        to_user.email as to_user_email,
        to_user.region as to_user_region,
        to_user.job_field as to_user_job_field,
        c.title as contest_title,
        t.name as team_name
      FROM nudges n
      LEFT JOIN users from_user ON n.from_user_id = from_user.id
      LEFT JOIN users to_user ON n.to_user_id = to_user.id
      LEFT JOIN contests c ON n.contest_id = c.id
      LEFT JOIN teams t ON n.team_id = t.id
      WHERE n.from_user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [userId, limitNum, offset]);

    // 전체 개수 조회
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM nudges WHERE from_user_id = ?",
      [userId]
    );
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        nudges: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  })
);

// 찔러보기 상태 업데이트 (읽음 처리)
router.patch(
  "/:id/read",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    // 찔러보기 존재 여부 및 권한 확인
    const [nudgeRows] = await pool.execute(
      "SELECT id, to_user_id FROM nudges WHERE id = ?",
      [id]
    );

    if ((nudgeRows as any[]).length === 0) {
      throw createError("찔러보기를 찾을 수 없습니다.", 404);
    }

    const nudge = (nudgeRows as any[])[0];
    if (nudge.to_user_id !== userId) {
      throw createError("권한이 없습니다.", 403);
    }

    // 상태 업데이트
    await pool.execute(
      "UPDATE nudges SET status = 'read', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "찔러보기를 읽음 처리했습니다.",
    });
  })
);

// 찔러보기 삭제
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    // 찔러보기 존재 여부 및 권한 확인
    const [nudgeRows] = await pool.execute(
      "SELECT id, from_user_id, to_user_id FROM nudges WHERE id = ?",
      [id]
    );

    if ((nudgeRows as any[]).length === 0) {
      throw createError("찔러보기를 찾을 수 없습니다.", 404);
    }

    const nudge = (nudgeRows as any[])[0];
    if (nudge.from_user_id !== userId && nudge.to_user_id !== userId) {
      throw createError("권한이 없습니다.", 403);
    }

    // 찔러보기 삭제
    await pool.execute("DELETE FROM nudges WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "찔러보기를 삭제했습니다.",
    });
  })
);

export default router;
