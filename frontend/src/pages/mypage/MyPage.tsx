import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { Link, useLocation } from "react-router-dom";
import { ProfileForm } from "./ProfileEditor";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiDelete, apiPost, apiPut } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SideLink = ({ to, label }: { to: string; label: string }) => {
  const { pathname } = useLocation();
  const isAccount = to === "/mypage/account";
  const active = isAccount
    ? pathname === "/mypage" || pathname === "/mypage/account"
    : pathname === to;
  return (
    <Link
      to={to}
      className={`block rounded px-2 py-1 text-sm ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
};

type FavoriteContest = {
  id: string;
  contest_id: string;
  title: string;
  topic: string;
  region: string;
  deadline: string;
  host: string;
  created_at: string;
};

type FavoriteTeam = {
  id: string;
  team_id: string;
  name: string;
  region: string;
  area: string;
  project_title: string;
  current_members: number;
  max_members: number;
  created_at: string;
};

type Team = {
  id: string;
  name: string;
  region: string;
  area: string;
  description: string;
  purpose: string;
  seeking_members: string;
  current_team_composition: string;
  ideal_candidate: string;
  collaboration_style: string;
  max_members: number;
  current_members: number;
  deadline: string;
  project_title: string;
  image_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: "pending" | "accepted" | "rejected";
  joined_at: string;
  name: string;
  email: string;
  job_field: string;
  skills: string;
};

type TeamWithMembers = {
  team: Team;
  members: TeamMember[];
};

const FavoriteContestCard = ({
  contest,
  onRemove,
}: {
  contest: FavoriteContest;
  onRemove: (id: string) => void;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Link
          to={`/contests/${contest.contest_id}`}
          className="text-sm font-semibold text-slate-900 hover:text-slate-700"
        >
          {contest.title}
        </Link>
        <div className="mt-1 text-xs text-slate-600">
          {contest.topic} · {contest.region}
        </div>
        <div className="mt-1 text-xs text-slate-500">주최: {contest.host}</div>
        <div className="mt-1 text-xs text-slate-500">
          마감:{" "}
          {contest.deadline
            ? new Date(contest.deadline).toLocaleDateString()
            : "미정"}
        </div>
      </div>
      <button
        onClick={() => onRemove(contest.id)}
        className="ml-2 text-xs text-slate-400 hover:text-red-500"
      >
        ×
      </button>
    </div>
  </div>
);

const FavoriteTeamCard = ({
  team,
  onRemove,
}: {
  team: FavoriteTeam;
  onRemove: (id: string) => void;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Link
          to={`/team/${team.team_id}`}
          className="text-sm font-semibold text-slate-900 hover:text-slate-700"
        >
          {team.name}
        </Link>
        <div className="mt-1 text-xs text-slate-600">{team.project_title}</div>
        <div className="mt-1 text-xs text-slate-500">
          {team.area} · {team.region}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          정원: {team.current_members}/{team.max_members}명
        </div>
      </div>
      <button
        onClick={() => onRemove(team.id)}
        className="ml-2 text-xs text-slate-400 hover:text-red-500"
      >
        ×
      </button>
    </div>
  </div>
);

const TeamCard = ({
  team,
  onDelete,
}: {
  team: Team;
  onDelete: (teamId: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (
      window.confirm(
        "정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      onDelete(team.id);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadge = () => {
    const deadline = new Date(team.deadline);
    const now = new Date();

    if (deadline < now) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          마감됨
        </span>
      );
    }

    const daysLeft = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3) {
      return (
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          마감 임박 ({daysLeft}일)
        </span>
      );
    }

    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        모집중 ({daysLeft}일 남음)
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {team.image_url && (
            <img
              src={team.image_url}
              alt={team.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
            <div className="text-sm text-slate-600">
              {team.area} · {team.region}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <div className="flex gap-1">
            <Link
              to={`/team/${team.id}`}
              className="rounded bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
            >
              보기
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">프로젝트</h4>
        <p className="text-sm text-slate-700">{team.project_title}</p>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">팀 소개</h4>
        <p className="text-sm text-slate-700 line-clamp-2">
          {team.description}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">정원:</span>
          <span className="ml-1 font-medium">
            {team.current_members}/{team.max_members}명
          </span>
        </div>
        <div>
          <span className="text-slate-500">마감일:</span>
          <span className="ml-1 font-medium">
            {new Date(team.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        등록일: {new Date(team.created_at).toLocaleDateString()}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              팀 삭제 확인
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              정말로 "{team.name}" 팀을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                삭제
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded bg-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MemberCard = ({
  member,
  onApprove,
  onReject,
  isLeader,
}: {
  member: TeamMember;
  onApprove: (memberId: string) => void;
  onReject: (memberId: string) => void;
  isLeader: boolean;
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            대기중
          </span>
        );
      case "accepted":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            승인됨
          </span>
        );
      case "rejected":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            거절됨
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "팀장") {
      return (
        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
          팀장
        </span>
      );
    }
    return (
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
        {role}
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{member.name}</h3>
            {getRoleBadge(member.role)}
            {getStatusBadge(member.status)}
          </div>
          <div className="mt-1 text-sm text-slate-600">{member.email}</div>
          <div className="mt-1 text-sm text-slate-500">
            <span className="font-medium">직군:</span> {member.job_field}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            <span className="font-medium">스킬:</span> {member.skills}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            가입일: {new Date(member.joined_at).toLocaleDateString()}
          </div>
        </div>
        {isLeader && member.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(member.id)}
              className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              승인
            </button>
            <button
              onClick={() => onReject(member.id)}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              거절
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamManageCard = ({
  teamData,
  onMemberStatusChange,
  isLeader,
}: {
  teamData: TeamWithMembers;
  onMemberStatusChange: () => void;
  isLeader: boolean;
}) => {
  const { team, members } = teamData;
  const { token } = useAuth();
  const [showReview, setShowReview] = useState(false);
  const [reviewState, setReviewState] = useState<
    Record<string, { rating: number; comment: string }>
  >({});

  const handleApprove = async (memberId: string) => {
    if (!token) return;

    try {
      await apiPost(
        `/api/teams/${team.id}/members/${memberId}`,
        { status: "accepted" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("팀 가입을 승인했습니다.");
      onMemberStatusChange();
    } catch (error) {
      console.error("승인 처리 오류:", error);
      alert("승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (memberId: string) => {
    if (!token) return;

    try {
      await apiPost(
        `/api/teams/${team.id}/members/${memberId}`,
        { status: "rejected" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("팀 가입을 거절했습니다.");
      onMemberStatusChange();
    } catch (error) {
      console.error("거절 처리 오류:", error);
      alert("거절 처리에 실패했습니다.");
    }
  };

  const pendingMembers = members.filter((m) => m.status === "pending");
  const acceptedMembers = members.filter((m) => m.status === "accepted");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {team.image_url && (
          <img
            src={team.image_url}
            alt={team.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
          <div className="text-sm text-slate-600">
            {team.area} · {team.region}
          </div>
        </div>
      </div>

      {isLeader && acceptedMembers.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setShowReview(true)}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            프로젝트 완료
          </button>
        </div>
      )}

      <div className="mb-4 text-sm text-slate-700">
        <p className="font-medium">프로젝트: {team.project_title}</p>
        <p className="mt-1">{team.description}</p>
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          정원: {team.current_members}/{team.max_members}명
        </span>
        <span className="text-slate-600">
          마감: {new Date(team.deadline).toLocaleDateString()}
        </span>
      </div>

      {/* 승인된 멤버들 */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          팀원 ({acceptedMembers.length}명)
        </h3>
        {acceptedMembers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {acceptedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onApprove={() => {}}
                onReject={() => {}}
                isLeader={false}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            승인된 팀원이 없습니다.
          </div>
        )}
      </div>

      {/* 대기중인 신청자들 */}
      {isLeader && pendingMembers.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            가입 신청 ({pendingMembers.length}명)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onApprove={handleApprove}
                onReject={handleReject}
                isLeader={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 가입 신청이 없는 경우 */}
      {isLeader && pendingMembers.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
          새로운 가입 신청이 없습니다.
        </div>
      )}

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                프로젝트 완료 · 팀원 리뷰
              </h3>
              <button
                onClick={() => setShowReview(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {acceptedMembers.map((m) => (
                <div key={m.id} className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-900">
                    {m.name}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        평점(1~5)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={reviewState[m.id]?.rating ?? 5}
                        onChange={(e) =>
                          setReviewState((prev) => ({
                            ...prev,
                            [m.id]: {
                              rating: Number(e.target.value),
                              comment: prev[m.id]?.comment ?? "",
                            },
                          }))
                        }
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-600 mb-1">
                        코멘트(선택)
                      </label>
                      <input
                        type="text"
                        value={reviewState[m.id]?.comment ?? ""}
                        onChange={(e) =>
                          setReviewState((prev) => ({
                            ...prev,
                            [m.id]: {
                              rating: prev[m.id]?.rating ?? 5,
                              comment: e.target.value,
                            },
                          }))
                        }
                        placeholder="함께한 소감, 강점/보완점 등을 작성해 주세요"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowReview(false)}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!token) return;
                  const payload = {
                    reviews: acceptedMembers.map((m) => ({
                      memberId: m.id,
                      rating: reviewState[m.id]?.rating ?? 5,
                      comment: reviewState[m.id]?.comment ?? "",
                    })),
                  };
                  try {
                    await apiPost(`/api/teams/${team.id}/reviews`, payload, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    });
                    alert("리뷰가 저장되었습니다. 수고하셨습니다!");
                    setShowReview(false);
                  } catch (e) {
                    console.error(e);
                    alert("리뷰 저장 중 오류가 발생했습니다.");
                  }
                }}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FavoritesContent = () => {
  const { token } = useAuth();
  const [contests, setContests] = useState<FavoriteContest[]>([]);
  const [teams, setTeams] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!token) return;

    try {
      const response = await apiGet<{
        success: boolean;
        data: {
          contests: FavoriteContest[];
          teams: FavoriteTeam[];
        };
      }>("/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setContests(response.data.contests);
      setTeams(response.data.teams);
    } catch (error) {
      console.error("관심사 목록을 불러오는데 실패했습니다:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeFavorite = async (id: string) => {
    if (!token) return;

    try {
      await apiDelete(`/api/favorites/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 목록에서 제거
      setContests((prev) => prev.filter((c) => c.id !== id));
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("관심사 제거에 실패했습니다:", error);
      alert("관심사 제거에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token, fetchFavorites]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            관심사를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div>
          <div className="text-sm font-semibold">관심 팀</div>
          {teams.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <FavoriteTeamCard
                  key={team.id}
                  team={team}
                  onRemove={removeFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 text-center text-sm text-slate-500">
              관심 팀이 없습니다.
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="text-sm font-semibold">관심 공모전/대회</div>
          {contests.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contests.map((contest) => (
                <FavoriteContestCard
                  key={contest.id}
                  contest={contest}
                  onRemove={removeFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 text-center text-sm text-slate-500">
              관심 공모전이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AccountContent = () => {
  const { token, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    region: "",
    district: "",
    school: "",
    status: "재학중",
    major: "",
    birth_date: "",
    job_field: "개발자",
    github_url: "",
    figma_url: "",
  });

  // 사용자 정보 로드
  const fetchUserInfo = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiGet<{
        success: boolean;
        data: {
          user: {
            id: string;
            email: string;
            name: string;
            region: string;
            school: string;
            major: string;
            birth_date: string;
            job_field: string;
            skills: string;
            github_url?: string | null;
            figma_url?: string | null;
          };
        };
      }>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = response.data.user;

      // birth_date를 YYYY-MM-DD 형식으로 변환 (input type="date"용)
      let formattedBirthDate = "";
      if (user.birth_date) {
        try {
          const date = new Date(user.birth_date);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            formattedBirthDate = `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error("Date parsing error:", e);
        }
      }

      setFormData({
        name: user.name || "",
        email: user.email || "",
        region: user.region || "",
        district: "", // 별도 필드가 없으므로 빈 문자열
        school: user.school || "",
        status: "재학중", // 별도 필드가 없으므로 기본값
        major: user.major || "",
        birth_date: formattedBirthDate,
        job_field: user.job_field || "개발자",
        github_url: user.github_url || "",
        figma_url: user.figma_url || "",
      });

      // 스킬 설정
      if (user.skills) {
        setSkills(user.skills.split(",").map((skill: string) => skill.trim()));
      }
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      alert("사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSaving(true);
    try {
      await apiPut(
        "/api/auth/me",
        {
          name: formData.name,
          region: formData.region,
          school: formData.school,
          major: formData.major,
          birth_date: formData.birth_date || null,
          job_field: formData.job_field,
          skills: skills.join(", "),
          github_url: formData.github_url,
          figma_url: formData.figma_url,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 성공 토스트 표시
      setToast({
        type: "success",
        message: "사용자 정보가 성공적으로 저장되었습니다!",
      });

      // 토스트 자동 숨김
      setTimeout(() => setToast(null), 3000);

      // AuthContext의 사용자 정보도 즉시 업데이트
      updateUser({
        name: formData.name,
        region: formData.region,
      });

      // 저장 후 서버에서 최신 데이터 다시 가져오기
      await fetchUserInfo();

      // 수정 모드 종료
      setIsEditing(false);
    } catch (error) {
      console.error("사용자 정보 저장 실패:", error);
      setToast({ type: "error", message: "사용자 정보 저장에 실패했습니다." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 원래 데이터로 복원
    fetchUserInfo();
  };

  // 입력 필드 공통 스타일
  const getInputClassName = () => {
    return `w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
      isEditing
        ? "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
        : "border-slate-200 bg-slate-50 text-slate-900 cursor-not-allowed"
    }`;
  };

  // select 필드 공통 스타일
  const getSelectClassName = () => {
    return `w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 ${
      isEditing
        ? "border-slate-300 focus:border-slate-500 focus:ring-slate-500"
        : "border-slate-200 bg-slate-50 text-slate-900 cursor-not-allowed"
    }`;
  };

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            사용자 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center">
            <div className="text-slate-500">
              <p className="text-lg">로그인이 필요합니다.</p>
              <p className="mt-2 text-sm">계정 관리를 위해 로그인해주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">계정 관리</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800 transition-colors"
            >
              수정
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              기본 정보
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  지역 (시/도) *
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  placeholder="예: 서울특별시"
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  지역 (시/군/구)
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="예: 강남구"
                  className={getInputClassName()}
                />
              </div>
            </div>
          </div>

          {/* 학력 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              학력 정보
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  학교명 *
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  상태 *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={getSelectClassName()}
                >
                  <option value="재학중">재학중</option>
                  <option value="졸업">졸업</option>
                  <option value="휴학중">휴학중</option>
                  <option value="취준생">취준생</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  전공명
                </label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={getInputClassName()}
                />
              </div>
            </div>
          </div>

          {/* 추가 개인 정보 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              추가 개인 정보
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                생년월일 *
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={getInputClassName()}
              />
            </div>
          </div>

          {/* 직군 및 스킬 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              직군 및 스킬
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  직군 *
                </label>
                <select
                  name="job_field"
                  value={formData.job_field}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={getSelectClassName()}
                >
                  <option value="프론트엔드">프론트엔드</option>
                  <option value="백엔드">백엔드</option>
                  <option value="풀스택">풀스택</option>
                  <option value="AI/ML 엔지니어">AI/ML 엔지니어</option>
                  <option value="UI/UX 디자이너">UI/UX 디자이너</option>
                  <option value="모바일 개발">모바일 개발</option>
                  <option value="기획자">기획자</option>
                  <option value="마케터">마케터</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  스킬 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isEditing}
                    placeholder="스킬을 입력하고 Enter를 누르세요"
                    className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-1 disabled:bg-slate-100 disabled:border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!isEditing}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 및 SNS */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              연락처 및 SNS
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://github.com/username"
                  className={getInputClassName()}
                />
                <p className="mt-1 text-xs text-slate-500">
                  GitHub 프로필 URL을 입력하면 활동 통계가 표시됩니다.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Figma URL
                </label>
                <input
                  type="url"
                  name="figma_url"
                  value={formData.figma_url}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://www.figma.com/file/..."
                  className={getInputClassName()}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Figma 파일 URL을 입력하면 디자인을 미리볼 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-8 py-3 text-slate-900 hover:bg-slate-50 disabled:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-8 py-3 text-white hover:bg-slate-800 disabled:bg-slate-400"
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}
        </form>

        {/* 토스트 알림 - 하단 중앙 */}
        {toast && (
          <div
            className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="text-white hover:text-gray-200 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TeamRegistrationManageContent = () => {
  const { token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCreatedTeams = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-created-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTeams(response.data.teams);
    } catch (error) {
      console.error("내가 만든 팀 목록 조회 실패:", error);
      // 401 오류인 경우 로그인 페이지로 리다이렉트
      if (error instanceof Error && error.message.includes("401")) {
        window.location.href = "/login";
        return;
      }
      alert("팀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleDeleteTeam = async (teamId: string) => {
    if (!token) return;

    try {
      await apiDelete(`/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("팀이 성공적으로 삭제되었습니다.");
      setTeams((prev) => prev.filter((team) => team.id !== teamId));
    } catch (error) {
      console.error("팀 삭제 실패:", error);
      alert("팀 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchMyCreatedTeams();
  }, [fetchMyCreatedTeams]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            팀 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!token) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">로그인이 필요합니다.</p>
                <p className="mt-2 text-sm">
                  팀 등록 관리를 위해 로그인해주세요.
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-block rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
                >
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">팀 등록 관리</h2>
              <p className="mt-1 text-sm text-slate-600">
                내가 등록한 팀들을 관리하고 수정할 수 있습니다.
              </p>
            </div>
            <Link
              to="/mypage/posts"
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              새 팀 등록
            </Link>
          </div>

          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">아직 등록한 팀이 없습니다.</p>
                <p className="mt-2 text-sm">새 팀을 만들어보세요.</p>
                <Link
                  to="/mypage/posts"
                  className="mt-4 inline-block rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
                >
                  팀 등록하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">팀 등록 관리</h2>
            <p className="mt-1 text-sm text-slate-600">
              내가 등록한 {teams.length}개의 팀을 관리하고 수정할 수 있습니다.
            </p>
          </div>
          <Link
            to="/mypage/posts"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            새 팀 등록
          </Link>
        </div>

        <div className="space-y-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onDelete={handleDeleteTeam} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TeamManageContent = () => {
  const { user, token } = useAuth();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTeams = useCallback(async () => {
    if (!token) return;

    try {
      // 내가 속한 팀 목록 조회
      const teamsResponse = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>("/api/teams/my-teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 각 팀의 상세 정보와 멤버 정보 조회
      const teamsWithMembers = await Promise.all(
        teamsResponse.data.teams.map(async (team) => {
          try {
            const teamDetailResponse = await apiGet<{
              success: boolean;
              data: { team: Team; members: TeamMember[] };
            }>(`/api/teams/${team.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return teamDetailResponse.data;
          } catch (error) {
            console.error(`팀 ${team.id} 정보 조회 실패:`, error);
            return { team, members: [] };
          }
        })
      );

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error("내 팀 목록 조회 실패:", error);
      alert("팀 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyTeams();
  }, [fetchMyTeams]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="text-center text-slate-500">
            팀 정보를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex-1">
        <div className="rounded-xl bg-slate-100 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">팀원 관리</h2>
            <p className="mt-1 text-sm text-slate-600">
              내가 속한 팀의 멤버들을 관리하고 가입 신청을 처리할 수 있습니다.
            </p>
          </div>

          <div className="text-center">
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-8">
              <div className="text-slate-500">
                <p className="text-lg">아직 참여한 팀이 없습니다.</p>
                <p className="mt-2 text-sm">
                  팀에 가입하거나 새 팀을 만들어보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">팀원 관리</h2>
          <p className="mt-1 text-sm text-slate-600">
            내가 속한 팀의 멤버들을 관리하고 가입 신청을 처리할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          {teams.map((teamData) => {
            const isLeader = teamData.team.created_by === user?.id;
            return (
              <TeamManageCard
                key={teamData.team.id}
                teamData={teamData}
                onMemberStatusChange={fetchMyTeams}
                isLeader={isLeader}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TeamCreateForm = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    area: "",
    description: "",
    maxMembers: 4,
    deadline: "",
    projectTitle: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiPost(
        "/api/teams",
        {
          name: formData.name,
          region: formData.region,
          area: formData.area,
          description: formData.description,
          max_members: parseInt(formData.maxMembers.toString()),
          deadline: formData.deadline,
          project_title: formData.projectTitle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const responseData = response as { success: boolean };
      if (responseData.success) {
        alert("팀이 성공적으로 등록되었습니다!");
        navigate("/team");
      } else {
        alert("팀 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("팀 등록 오류:", error);
      alert("팀 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="rounded-xl bg-slate-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">팀 등록</h2>
          <p className="mt-2 text-slate-600">
            새로운 팀을 만들어 함께할 멤버들을 모집해보세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              팀 이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="예: AI 혁신팀"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-slate-700"
              >
                지역 *
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">지역을 선택하세요</option>
                <option value="서울">서울</option>
                <option value="부산">부산</option>
                <option value="대구">대구</option>
                <option value="인천">인천</option>
                <option value="광주">광주</option>
                <option value="대전">대전</option>
                <option value="울산">울산</option>
                <option value="세종">세종</option>
                <option value="경기">경기</option>
                <option value="강원">강원</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="제주">제주</option>
                <option value="전국">전국</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="area"
                className="block text-sm font-medium text-slate-700"
              >
                분야 *
              </label>
              <select
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">분야를 선택하세요</option>
                <option value="해커톤">해커톤</option>
                <option value="AI/ML">AI/ML</option>
                <option value="웹 개발">웹 개발</option>
                <option value="모바일">모바일</option>
                <option value="게임 개발">게임 개발</option>
                <option value="블록체인">블록체인</option>
                <option value="IoT">IoT</option>
                <option value="AR/VR">AR/VR</option>
                <option value="핀테크">핀테크</option>
                <option value="헬스케어">헬스케어</option>
                <option value="에듀테크">에듀테크</option>
                <option value="그린테크">그린테크</option>
                <option value="푸드테크">푸드테크</option>
                <option value="소셜 임팩트">소셜 임팩트</option>
                <option value="창업">창업</option>
                <option value="디자인">디자인</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="projectTitle"
              className="block text-sm font-medium text-slate-700"
            >
              프로젝트 제목 *
            </label>
            <input
              type="text"
              id="projectTitle"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="예: AI 기반 의료 진단 서비스"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              팀 소개 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="팀의 목표, 진행할 프로젝트, 필요한 멤버 등에 대해 자세히 설명해주세요."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="maxMembers"
                className="block text-sm font-medium text-slate-700"
              >
                최대 멤버 수 *
              </label>
              <select
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value={3}>3명</option>
                <option value={4}>4명</option>
                <option value={5}>5명</option>
                <option value={6}>6명</option>
                <option value={7}>7명</option>
                <option value={8}>8명</option>
                <option value={9}>9명</option>
                <option value={10}>10명</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-slate-700"
              >
                모집 마감일 *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/team")}
              className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 disabled:bg-slate-400"
            >
              {loading ? "등록 중..." : "팀 등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyPage = () => {
  const { pathname } = useLocation();

  const renderContent = (() => {
    if (pathname === "/mypage/favorites") return <FavoritesContent />;
    if (pathname === "/mypage/profile") return <ProfileForm />;
    if (pathname === "/mypage/posts") return <TeamCreateForm />;
    if (pathname === "/mypage/team-registration")
      return <TeamRegistrationManageContent />;
    if (pathname === "/mypage/manage") return <TeamManageContent />;
    return <AccountContent />;
  })();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        <div className="flex gap-8">
          <aside className="w-40 space-y-6 text-sm">
            <div>
              <div className="mb-2 text-slate-500">회원</div>
              <nav className="space-y-1">
                <SideLink to="/mypage/account" label="계정" />
                <SideLink to="/mypage/favorites" label="관심" />
                <SideLink to="/mypage/profile" label="프로필" />
              </nav>
            </div>
            <div>
              <div className="mb-2 text-slate-500">팀</div>
              <nav className="space-y-1">
                <SideLink to="/mypage/posts" label="모집 공고" />
                <SideLink to="/mypage/team-registration" label="팀 등록 관리" />
                <SideLink to="/mypage/manage" label="팀원 관리" />
              </nav>
            </div>
          </aside>
          {renderContent}
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default MyPage;
