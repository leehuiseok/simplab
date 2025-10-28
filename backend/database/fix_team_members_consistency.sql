-- 팀 멤버 수 정합성 보정 및 유지 트리거

-- 1) 현재 데이터 일괄 보정: teams.current_members = accepted 멤버 수
UPDATE teams t
JOIN (
  SELECT team_id, COUNT(*) AS actual_members
  FROM team_members
  WHERE status = 'accepted'
  GROUP BY team_id
) x ON x.team_id = t.id
SET t.current_members = x.actual_members;

-- accepted 멤버가 하나도 없는 팀을 0으로 보정
UPDATE teams t
LEFT JOIN (
  SELECT team_id, COUNT(*) AS actual_members
  FROM team_members
  WHERE status = 'accepted'
  GROUP BY team_id
) x ON x.team_id = t.id
SET t.current_members = 0
WHERE x.team_id IS NULL;

-- 2) 유지 트리거: team_members에 대한 변경이 있을 때 teams.current_members 동기화

-- 기존 트리거가 있으면 제거
DROP TRIGGER IF EXISTS trg_team_members_ai;
DROP TRIGGER IF EXISTS trg_team_members_au;
DROP TRIGGER IF EXISTS trg_team_members_ad;

-- AFTER INSERT: accepted로 삽입되면 +1
DELIMITER //
CREATE TRIGGER trg_team_members_ai
AFTER INSERT ON team_members
FOR EACH ROW
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE teams SET current_members = current_members + 1 WHERE id = NEW.team_id;
  END IF;
END //
DELIMITER ;

-- AFTER UPDATE: 상태 변경에 따라 증감
DELIMITER //
CREATE TRIGGER trg_team_members_au
AFTER UPDATE ON team_members
FOR EACH ROW
BEGIN
  -- non-accepted -> accepted 로 변경 시 +1
  IF (OLD.status <> 'accepted') AND (NEW.status = 'accepted') THEN
    UPDATE teams SET current_members = current_members + 1 WHERE id = NEW.team_id;
  END IF;

  -- accepted -> non-accepted 로 변경 시 -1
  IF (OLD.status = 'accepted') AND (NEW.status <> 'accepted') THEN
    UPDATE teams SET current_members = current_members - 1 WHERE id = NEW.team_id;
  END IF;
END //
DELIMITER ;

-- AFTER DELETE: accepted였던 멤버 삭제 시 -1
DELIMITER //
CREATE TRIGGER trg_team_members_ad
AFTER DELETE ON team_members
FOR EACH ROW
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE teams SET current_members = current_members - 1 WHERE id = OLD.team_id;
  END IF;
END //
DELIMITER ;


