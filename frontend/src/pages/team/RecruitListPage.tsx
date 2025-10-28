import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "@/shared/api";
import { useAuth } from "../../contexts/AuthContext";
import Container from "../../shared/ui/Container";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import TeamFilter, {
  type TeamFilterOptions,
} from "../../widgets/team/TeamFilter";

type Team = {
  id: string;
  name: string;
  region?: string | null;
  area?: string | null;
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
  isFavorited?: boolean;
  favoriteId?: string;
};

const RecruitCard = ({
  t,
  onToggleFavorite,
}: {
  t: Team;
  onToggleFavorite: (
    teamId: string,
    isFavorited: boolean,
    favoriteId?: string
  ) => void;
}) => {
  const { user } = useAuth();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    onToggleFavorite(t.id, t.isFavorited || false, t.favoriteId);
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300">
      <Link to={`/team/${t.id}`} className="block">
        <div className="flex items-start gap-4">
          {t.image_url ? (
            <img
              src={t.image_url}
              alt={t.name}
              className="h-14 w-14 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-slate-200" />
          )}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-slate-600">
              {t.area ?? "-"} · {t.region ?? "-"}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-slate-600 line-clamp-2">
            {t.description || t.purpose || "팀 모집 중입니다."}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="text-slate-700">
            정원{" "}
            <span className="font-semibold">
              {t.current_members || 0}/{t.max_members || 6}
            </span>
          </div>
          <div className="text-slate-700">
            {t.deadline
              ? `마감 ${new Date(t.deadline).toLocaleDateString()}`
              : "마감 D-18"}
          </div>
        </div>

        {/* 저장 버튼 - 카드 하단에 배치 */}
        {user && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleFavoriteClick}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                t.isFavorited
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
              aria-label={t.isFavorited ? "저장 취소" : "저장"}
            >
              {t.isFavorited ? "저장됨" : "저장"}
            </button>
          </div>
        )}
      </Link>
    </div>
  );
};

const RecruitListPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filters, setFilters] = useState<TeamFilterOptions>({
    region: "",
    area: "",
    teamSize: "",
    recruitmentStatus: "",
    deadlineStatus: "",
    traits: [],
  });
  const { user, token } = useAuth();

  const buildQueryString = useCallback((currentFilters: TeamFilterOptions) => {
    const params = new URLSearchParams();

    if (currentFilters.region) {
      params.append("region", currentFilters.region);
    }
    if (currentFilters.area) {
      params.append("area", currentFilters.area);
    }
    if (currentFilters.teamSize) {
      params.append("teamSize", currentFilters.teamSize);
    }
    if (currentFilters.recruitmentStatus) {
      params.append("recruitmentStatus", currentFilters.recruitmentStatus);
    }
    if (currentFilters.deadlineStatus) {
      params.append("deadlineStatus", currentFilters.deadlineStatus);
    }
    if (currentFilters.traits && currentFilters.traits.length > 0) {
      currentFilters.traits.forEach((trait) => {
        params.append("traits", trait);
      });
    }

    return params.toString();
  }, []);

  // 팀 목록과 즐겨찾기 정보를 함께 로드
  const loadTeams = useCallback(async () => {
    try {
      // 팀 목록 로드
      const queryString = buildQueryString(filters);
      const teamsResponse = await apiGet<{
        success: boolean;
        data: { teams: Team[] };
      }>(`/api/teams${queryString ? `?${queryString}` : ""}`);
      let teamsWithFavorites = teamsResponse.data.teams;

      // 로그인된 사용자의 경우 즐겨찾기 정보도 함께 로드
      if (user && token) {
        try {
          const favoritesResponse = await apiGet<{
            success: boolean;
            data: { teams: Array<{ id: string; team_id: string }> };
          }>("/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const favoriteTeamIds = new Set(
            favoritesResponse.data.teams.map((fav) => fav.team_id)
          );

          teamsWithFavorites = teamsResponse.data.teams.map((team) => ({
            ...team,
            isFavorited: favoriteTeamIds.has(team.id),
          }));
        } catch (favoritesError) {
          console.warn(
            "즐겨찾기 정보를 불러오는데 실패했습니다:",
            favoritesError
          );
          // 즐겨찾기 로드 실패해도 팀 목록은 표시
        }
      }

      setTeams(teamsWithFavorites);
    } catch (error) {
      console.error("팀 목록을 불러오는데 실패했습니다:", error);
      setTeams([]);
    }
  }, [filters, buildQueryString, user, token]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleFilterChange = useCallback((newFilters: TeamFilterOptions) => {
    setFilters(newFilters);
  }, []);

  const handleToggleFavorite = async (
    teamId: string,
    isFavorited: boolean,
    favoriteId?: string
  ) => {
    if (!user || !token) return;

    try {
      if (isFavorited && favoriteId) {
        // 즐겨찾기 제거
        await apiDelete(`/api/favorites/${favoriteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? { ...team, isFavorited: false, favoriteId: undefined }
              : team
          )
        );

        alert("즐겨찾기에서 제거되었습니다.");
      } else {
        // 즐겨찾기 추가
        await apiPost<{ success: boolean; message: string }>(
          "/api/favorites",
          { team_id: teamId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId ? { ...team, isFavorited: true } : team
          )
        );

        alert("즐겨찾기에 추가되었습니다.");
      }
    } catch (error) {
      console.error("즐겨찾기 처리 중 오류가 발생했습니다:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* 왼쪽 사이드바 - 필터링 */}
          <div className="w-full xl:w-96 flex-shrink-0">
            <TeamFilter
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>

          {/* 오른쪽 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">팀 모집 공고</h1>

              {/* 필터링 결과 정보 */}
              {(filters.region ||
                filters.area ||
                filters.teamSize ||
                filters.recruitmentStatus ||
                filters.deadlineStatus) && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">적용된 필터:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.region && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          📍 {filters.region}
                        </span>
                      )}
                      {filters.area && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          🎯 {filters.area}
                        </span>
                      )}
                      {filters.teamSize && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          👥 {filters.teamSize}
                        </span>
                      )}
                      {filters.recruitmentStatus && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          🔥 {filters.recruitmentStatus}
                        </span>
                      )}
                      {filters.deadlineStatus && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          ⏰ {filters.deadlineStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {teams?.map((t) => (
                <RecruitCard
                  key={t.id}
                  t={t}
                  onToggleFavorite={handleToggleFavorite}
                />
              )) || (
                <div className="col-span-full text-center text-slate-500">
                  팀 모집 공고를 불러오는 중...
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default RecruitListPage;
