import Container from "../../shared/ui/Container";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import { useEffect, useState } from "react";
import { apiGet } from "@/shared/api";
import NudgeButton from "../../shared/ui/NudgeButton";
import { useAuth } from "../../contexts/AuthContext";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-10">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
  </section>
);

type PortfolioItem = {
  id: string;
  title: string;
  link?: string | null;
  description?: string | null;
  contribution?: string | null;
  techStack: string[];
};
type Award = { id: string; title: string; awardedAt?: string | null };
type Profile = {
  id: string;
  bio?: string | null;
  skills: string[];
  traits: string[];
  tags: string[];
  githubUrl?: string | null;
  figmaUrl?: string | null;
  user: { name: string };
  awards: Award[];
  portfolioItems: PortfolioItem[];
};

type Favorite = {
  id: string;
  contest_id?: string;
  team_id?: string;
  contest?: { title?: string };
};

type UserTeam = {
  id: string;
  name: string;
  region?: string | null;
  area?: string | null;
  description?: string | null;
  project_title?: string | null;
  image_url?: string | null;
  role?: string | null;
  status?: string | null;
  joined_at?: string | null;
};

type ProfileReview = {
  id: string;
  teamId: string;
  memberId: string;
  reviewerUserId: string;
  reviewerName?: string;
  teamName?: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

const ProfileDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userFavorites, setUserFavorites] = useState<Favorite[]>([]);

  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [userTeamsLoading, setUserTeamsLoading] = useState(false);
  const [reviews, setReviews] = useState<ProfileReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProfileReview | null>(
    null
  );
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    apiGet<{ data: { profile: Profile } }>(`/api/profile/profiles/${id}`)
      .then((d) => setProfile(d.data.profile))
      .catch((error) => {
        console.error("프로필 로드 실패:", error);
        setProfile(null);
      });
  }, [id]);



  // 소속 팀 로드
  useEffect(() => {
    if (!id) return;
    setUserTeamsLoading(true);
    apiGet<{ success: boolean; data: { teams: UserTeam[] } }>(
      `/api/profile/profiles/${id}/teams`
    )
      .then((resp) => setUserTeams(resp.data.teams || []))
      .catch((err) => {
        console.warn("소속 팀 로드 실패:", err);
        setUserTeams([]);
      })
      .finally(() => setUserTeamsLoading(false));
  }, [id]);

  // 리뷰 로드
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    apiGet<{ success: boolean; data: { reviews: ProfileReview[] } }>(
      `/api/profile/profiles/${id}/reviews`
    )
      .then((resp) => {
        const fetched = resp.data.reviews || [];
        if (fetched.length === 0) {
          // 임시 더미 데이터 (API 데이터가 없을 때만 표시)
          const mock: ProfileReview[] = [
            {
              id: "mock-1",
              teamId: "team-001",
              memberId: "tm-001",
              reviewerUserId: "user-101",
              reviewerName: "홍길동",
              teamName: "AI 혁신팀",
              rating: 5,
              comment:
                "성실하고 커뮤니케이션이 뛰어나 프로젝트 일정 준수에 크게 기여했습니다.",
              createdAt: new Date().toISOString(),
            },
            {
              id: "mock-2",
              teamId: "team-002",
              memberId: "tm-002",
              reviewerUserId: "user-102",
              reviewerName: "김영희",
              teamName: "프론트엔드 스쿼드",
              rating: 4,
              comment: "문제 해결 능력이 좋고 리뷰 피드백 반영이 빠릅니다.",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ];
          setReviews(mock);
        } else {
          setReviews(fetched);
        }
      })
      .catch((err) => {
        console.warn("리뷰 로드 실패:", err);
        // 실패 시에도 임시 더미 표시
        const mock: ProfileReview[] = [
          {
            id: "mock-fallback-1",
            teamId: "team-003",
            memberId: "tm-003",
            reviewerUserId: "user-103",
            reviewerName: "이민수",
            teamName: "모바일 크루",
            rating: 5,
            comment: "주도적으로 과제를 정의하고 성실히 마무리합니다.",
            createdAt: new Date().toISOString(),
          },
        ];
        setReviews(mock);
      })
      .finally(() => setReviewsLoading(false));
  }, [id]);

  // 사용자의 관심 공모전 목록 로드 (찔러보기용)
  useEffect(() => {
    if (!user) return;
    apiGet<{ data: { favorites: Favorite[] } }>("/api/favorites")
      .then((d) => {
        // 공모전만 필터링
        const contestFavorites = d.data.favorites.filter(
          (fav) => !!fav.contest_id
        );
        setUserFavorites(contestFavorites);
      })
      .catch((error) => {
        console.error("관심 공모전 목록 로드 실패:", error);
        setUserFavorites([]);
      });
  }, [user]);

  // GitHub URL에서 username 추출
  const getGitHubUsername = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const match = url.match(/github\.com\/([^/]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const githubUsername = getGitHubUsername(profile?.githubUrl);

  // 로컬 더미 평가 로직 제거 (API 기반으로 대체)



  // (이전 더미 적합성 이유 로직 제거)

  // 키워드 후보: 스킬 + 성향 + 기본 키워드
  const defaultKeywords = [
    "성실",
    "우호",
    "리더십",
    "문제해결",
    "커뮤니케이션",
    "프론트엔드",
    "백엔드",
    "디자인",
    "데이터",
    "AI/ML",
  ];
  const availableKeywords = Array.from(
    new Set(
      [
        ...(profile?.skills || []),
        ...(profile?.traits || []),
        ...defaultKeywords,
      ].map((k) => String(k))
    )
  ).slice(0, 20);

  const toggleKeyword = (k: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold">
                  {profile?.user.name ?? `프로필 #${id}`}
                </div>

              </div>
              <p className="text-sm text-slate-600">
                {profile?.bio ?? "소개가 없습니다."}
              </p>


            </div>
          </div>

          {/* 찔러보기 버튼들 */}
          {user && id && id !== user.id && userFavorites.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-700">
                공모전 제안하기
              </div>
              <div className="flex flex-wrap gap-2">
                {userFavorites.map((favorite) => (
                  <NudgeButton
                    key={favorite.contest_id || favorite.id}
                    toUserId={id!}
                    contestId={favorite.contest_id || ""}
                    contestTitle={favorite.contest?.title || "공모전"}
                    className="text-xs px-3 py-1"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Section title="성향/작업방식">
          {profile?.traits?.length ? profile.traits.join(", ") : "-"}
        </Section>

        {/* 키워드 토글 */}
        <Section title="키워드">
          {availableKeywords.length === 0 ? (
            <div>-</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableKeywords.map((k) => {
                const active = selectedKeywords.includes(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => toggleKeyword(k)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-300 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {active ? "✓ " : ""}
                    {k}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="포트폴리오">
          <div className="space-y-4">
            {(profile?.portfolioItems ?? []).map((p) => (
              <div key={p.id} className="rounded border border-slate-200 p-3">
                <div className="text-sm font-semibold">{p.title}</div>
                {p.link ? (
                  <a
                    className="text-xs text-slate-600 underline"
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.link}
                  </a>
                ) : null}
                {p.description ? (
                  <div className="mt-2 text-xs text-slate-700">
                    {p.description}
                  </div>
                ) : null}
                {p.contribution ? (
                  <div className="mt-1 text-xs text-slate-700">
                    기여도: {p.contribution}
                  </div>
                ) : null}
                {p.techStack?.length ? (
                  <div className="mt-2 text-xs text-slate-600">
                    스택: {p.techStack.join(", ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>

        <Section title="수상 경력">
          {(profile?.awards ?? []).length ? (
            <ul className="list-disc pl-5">
              {profile!.awards.map((a) => (
                <li key={a.id}>
                  {a.title}{" "}
                  {a.awardedAt
                    ? `(${new Date(a.awardedAt).toLocaleDateString()})`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            "-"
          )}
        </Section>

        <Section title="다른 사람들의 리뷰">
          {reviewsLoading ? (
            <div>불러오는 중…</div>
          ) : reviews.length === 0 ? (
            <div>-</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reviews.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReview(r)}
                  className="rounded border border-slate-200 p-3 text-left hover:border-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">
                      {r.reviewerName || "알 수 없음"}
                    </div>
                    <div className="text-xs text-amber-600 font-semibold">
                      ★ {r.rating}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    팀: {r.teamName || r.teamId}
                  </div>
                  {r.comment && (
                    <div className="mt-2 line-clamp-2 text-sm text-slate-700">
                      {r.comment}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* 리뷰 상세 모달 */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  리뷰 상세
                </h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-slate-700">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">
                    작성자:{" "}
                    {selectedReview.reviewerName ||
                      selectedReview.reviewerUserId}
                  </div>
                  <div className="text-amber-600 font-semibold">
                    ★ {selectedReview.rating}
                  </div>
                </div>
                <div className="mb-2 text-xs text-slate-600">
                  팀: {selectedReview.teamName || selectedReview.teamId}
                </div>
                {selectedReview.comment && (
                  <div className="mb-3 whitespace-pre-wrap">
                    {selectedReview.comment}
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        <Section title="속한 팀">
          {userTeamsLoading ? (
            <div>불러오는 중…</div>
          ) : userTeams.length === 0 ? (
            <div>-</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {userTeams.map((t) => (
                <Link
                  to={`/team/${t.id}`}
                  key={t.id}
                  className="rounded border border-slate-200 p-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {t.image_url ? (
                      <img
                        src={t.image_url}
                        alt={t.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-slate-200" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-slate-600">
                        {(t.area || "-") + " · " + (t.region || "-")}
                      </div>
                      {t.project_title && (
                        <div className="mt-1 text-xs text-slate-700">
                          프로젝트: {t.project_title}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-slate-700">
                        역할: {t.role || "-"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="태그">
          <div className="flex flex-wrap gap-2">
            {[
              ...(profile?.tags ?? []),
              ...selectedKeywords.filter(
                (k) => !(profile?.tags || []).includes(k)
              ),
            ].map((t) => (
              <span
                key={`tag-${t}`}
                className="rounded-full border border-slate-300 px-3 py-1 text-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        {profile?.githubUrl && (
          <Section title="GitHub 활동">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  GitHub 프로필 보기
                </a>
              </div>
              {githubUsername && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    Contributions 통계
                  </h4>
                  <div className="overflow-x-auto rounded border border-slate-200 p-3">
                    <img
                      src={`https://ghchart.rshah.org/${githubUsername}`}
                      alt={`${githubUsername}'s GitHub chart`}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {profile?.figmaUrl && (
          <Section title="Figma 디자인">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.852 8.981h-4.588v-1.577c0-1.729 1.51-3.267 3.218-3.267.87 0 1.696.172 2.333.475.14.065.292.096.445.089a.597.597 0 0 0 .388-.176.572.572 0 0 0 .175-.39L17.886.586a.573.573 0 0 0-.176-.391.606.606 0 0 0-.394-.175c-.15-.004-.302.023-.445.081a6.82 6.82 0 0 0-2.836-1.369 5.375 5.375 0 0 0-1.126-.116 5.547 5.547 0 0 0-4.658 2.512c-1.39 1.896-1.33 4.646.139 6.474l-2.35 2.832a9.217 9.217 0 0 0-3.16-.559c-.17 0-.339.012-.506.037C.071 9.67-.335 10.862.102 11.908a3.523 3.523 0 0 0 .972 1.452 3.24 3.24 0 0 0 1.45.949c.542.214 1.124.253 1.688.101a9.217 9.217 0 0 0 3.16-.559l2.35 2.832c-1.465 1.825-1.53 4.575-.138 6.472a5.547 5.547 0 0 0 4.658 2.511 5.375 5.375 0 0 0 1.126-.116 6.82 6.82 0 0 0 2.836-1.369c.143-.06.295-.087.445-.082a.597.597 0 0 0 .388.176.571.571 0 0 0 .388-.176.572.572 0 0 0 .175-.389l.152-4.013a.594.594 0 0 0-.175-.39.606.606 0 0 0-.394-.176c-.151-.004-.303.023-.445.089a6.804 6.804 0 0 0-2.333.475c-1.508 1.658-3.968.716-4.043-.599v-1.578h4.588c1.379 0 2.527-1.25 2.527-2.78V11.76c0-1.529-1.148-2.779-2.527-2.779M7.184 5.163c-.31-.277-.729-.416-1.165-.416A1.912 1.912 0 0 0 4.12 6.665 1.918 1.918 0 0 0 6.019 8.58a1.9 1.9 0 0 0 1.924-1.963c0-.499-.21-.943-.48-1.217zm8.7 14.224a1.897 1.897 0 0 1-1.924 1.962 1.91 1.91 0 0 1-1.913-1.918 1.917 1.917 0 0 1 1.913-1.917 1.9 1.9 0 0 1 1.924 1.873zm1.938-13.708a1.912 1.912 0 0 1 1.899 1.917A1.918 1.918 0 0 1 17.813 9.5a1.91 1.91 0 0 1-1.899-1.916 1.905 1.905 0 0 1 .998-1.416z" />
                </svg>
                <a
                  href={profile.figmaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Figma 파일 보기
                </a>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <iframe
                  src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
                    profile.figmaUrl
                  )}`}
                  width="100%"
                  height="600"
                  style={{ border: "none" }}
                  title="Figma Design"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            </div>
          </Section>
        )}
      </Container>
      <AppFooter />
    </div>
  );
};

export default ProfileDetailPage;
