import Container from "../../shared/ui/Container";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/shared/api";
import { useAuth } from "../../contexts/AuthContext";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-12 text-lg font-semibold">{children}</h3>
);

const Avatar = ({
  name,
  badge,
  id,
}: {
  name: string;
  badge?: string;
  id: string;
}) => (
  <Link to={`/profile/${id}`} className="flex flex-col items-center">
    <div className="relative h-20 w-20 rounded-full bg-slate-200" />
    {badge ? (
      <span className="mt-2 inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-white">
        {badge}
      </span>
    ) : null}
    <div className="mt-1 text-sm text-slate-700">{name}</div>
  </Link>
);

type TeamMember = {
  id: string;
  role: string;
  user: { id: string; name: string; profiles?: { id: string }[] };
};

type ApiTeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  name: string;
  email: string;
  job_field: string;
  skills: string;
};

type TeamDetail = {
  id: string;
  name: string;
  area?: string | null;
  region?: string | null;
  description?: string | null;
  purpose?: string | null;
  seeking_members?: string | null;
  current_team_composition?: string | null;
  ideal_candidate?: string | null;
  collaboration_style?: string | null;
  max_members?: number;
  current_members?: number;
  deadline?: string | null;
  project_title?: string | null;
  image_url?: string | null;
  members: TeamMember[];
};

type Recommendation = {
  user: {
    id: string;
    name: string;
    email?: string;
    region?: string;
    job_field?: string;
    skills: string[];
  };
  score: number; // 0~100
  reasons: string[];
  breakdown: {
    skillScore: number; // 0~100
    belbinScore: number; // 0~100
    big5Score: number; // 0~100
    weights: { W_SKILL: number; W_BELBIN: number; W_BIG5: number };
  };
};

const RecruitDetailPage = () => {
  const { id } = useParams();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  // 즐겨찾기 상태 확인
  useEffect(() => {
    if (!user || !token || !id) return;

    apiGet<{
      success: boolean;
      data: { teams: Array<{ id: string; team_id: string }> };
    }>("/api/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        const favorite = response.data.teams.find((fav) => fav.team_id === id);
        setIsFavorited(!!favorite);
        setFavoriteId(favorite?.id || null);
      })
      .catch((error) => {
        console.warn("즐겨찾기 상태 확인 실패:", error);
      });
  }, [user, token, id]);

  useEffect(() => {
    if (!id) return;
    apiGet<{
      success: boolean;
      data: { team: TeamDetail; members: ApiTeamMember[] };
    }>(`/api/teams/${id}`)
      .then((d) => {
        setTeam({
          ...d.data.team,
          members: d.data.members.map((member) => ({
            id: member.id,
            role: member.role,
            user: {
              id: member.user_id,
              name: member.name,
              profiles: [],
            },
          })),
        });
      })
      .catch((error) => {
        console.error("팀 정보를 불러오는데 실패했습니다:", error);
        setTeam(null);
      });
  }, [id]);

  // 추천 팀원 로드
  useEffect(() => {
    if (!id || !token) return;
    setRecLoading(true);
    apiPost<{
      success: boolean;
      data: { recommendations: Recommendation[] };
    }>(
      `/api/teams/${id}/recommendations`,
      { limit: 6 },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((resp) => {
        setRecs(resp.data.recommendations || []);
      })
      .catch((err) => {
        console.warn("추천 로드 실패:", err);
        setRecs([]);
      })
      .finally(() => setRecLoading(false));
  }, [id, token]);

  const handleToggleFavorite = async () => {
    if (!user || !token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    try {
      if (isFavorited && favoriteId) {
        // 즐겨찾기 제거
        await apiDelete(`/api/favorites/${favoriteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsFavorited(false);
        setFavoriteId(null);
        alert("즐겨찾기에서 제거되었습니다.");
      } else {
        // 즐겨찾기 추가
        await apiPost<{ success: boolean; message: string }>(
          "/api/favorites",
          { team_id: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setIsFavorited(true);
        alert("즐겨찾기에 추가되었습니다.");
      }
    } catch (error) {
      console.error("즐겨찾기 처리 중 오류가 발생했습니다:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <div className="bg-slate-100">
        <Container className="py-10">
          {team?.image_url ? (
            <img
              src={team.image_url}
              alt={team.name}
              className="h-48 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="h-48 w-full rounded-xl bg-slate-200" />
          )}
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-md bg-slate-200" />
            <div className="space-y-1">
              <div className="text-xl font-bold">
                {team?.name ?? `팀 이름 #${id}`}
              </div>
              {/* 현재 인원/정원 배지 */}
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700">
                  {`${team?.members?.length || 0}/${team?.max_members || 6}`}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                {team
                  ? `${team.area ?? "-"} · ${team.region ?? "-"}`
                  : "로딩 중"}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-slate-400">
              공유
            </button>
            {user && (
              <button
                onClick={handleToggleFavorite}
                disabled={loading}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isFavorited
                    ? "bg-black text-white hover:bg-gray-800"
                    : "border border-slate-300 text-slate-800 hover:border-slate-400"
                }`}
              >
                {loading ? "처리중..." : isFavorited ? "저장됨" : "저장"}
              </button>
            )}
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              지원
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <SectionTitle>기본 개요</SectionTitle>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>지역: {team?.region ?? "-"}</li>
              <li>분야: {team?.area ?? "-"}</li>
              <li>프로젝트: {team?.project_title ?? "-"}</li>
              <li>
                정원: {team?.members?.length || 0}/{team?.max_members || 6}명
              </li>
              <li>
                마감일:{" "}
                {team?.deadline
                  ? new Date(team.deadline).toLocaleDateString()
                  : "-"}
              </li>
            </ul>

            {team?.description && (
              <>
                <SectionTitle>팀 소개</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.description}
                </p>
              </>
            )}

            {team?.purpose && (
              <>
                <SectionTitle>프로젝트 목적</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.purpose}
                </p>
              </>
            )}

            {team?.seeking_members && (
              <>
                <SectionTitle>구하는 팀원</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.seeking_members}
                </p>
              </>
            )}

            {team?.current_team_composition && (
              <>
                <SectionTitle>현재 팀원 구성</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.current_team_composition}
                </p>
              </>
            )}

            {team?.ideal_candidate && (
              <>
                <SectionTitle>원하는 팀원 인재상</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.ideal_candidate}
                </p>
              </>
            )}

            {team?.collaboration_style && (
              <>
                <SectionTitle>협업 방식</SectionTitle>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {team.collaboration_style}
                </p>
              </>
            )}

            <SectionTitle>현재 팀원</SectionTitle>
            <div className="mt-3 grid grid-cols-3 gap-6">
              {(team?.members ?? []).map((m) => (
                <Avatar
                  key={m.id}
                  id={m.user.profiles?.[0]?.id ?? m.user.id}
                  name={m.user.name}
                  badge={m.role}
                />
              ))}
            </div>

            <SectionTitle>추천 팀원</SectionTitle>
            {recLoading ? (
              <div className="mt-3 text-sm text-slate-600">불러오는 중…</div>
            ) : recs.length === 0 ? (
              <div className="mt-3 text-sm text-slate-600">
                추천 결과가 없습니다.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-6">
                {recs.map((r) => (
                  <div key={r.user.id} className="flex flex-col items-center">
                    <Avatar id={r.user.id} name={r.user.name} />
                    <span className="mt-1 inline-block rounded bg-green-700 px-2 py-0.5 text-[10px] font-medium text-white">
                      {r.score.toFixed(0)}%
                    </span>
                    {r.reasons?.length ? (
                      <ul className="mt-2 list-disc pl-4 text-[11px] text-slate-600">
                        {r.reasons.slice(0, 3).map((rsn, idx) => (
                          <li key={idx}>{rsn}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SectionTitle>태깅</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {["#충남대학교", "#대전", "#송정도", "#보안"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-300 px-3 py-1 text-slate-700"
            >
              {t}
            </span>
          ))}
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default RecruitDetailPage;
