import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  description?: string | null;
  host?: string | null;
  format?: string | null;
  features?: string | null;
  required_skills?: string | null;
  team_composition?: string | null;
  image_url?: string | null;
};

type RecommendedUser = {
  id: string;
  name: string;
  email: string;
  region: string;
  school?: string;
  major?: string;
  job_field?: string;
  skills: string[];
  match_score: number;
};

const ContestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>(
    []
  );
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    apiGet<{
      success: boolean;
      data: { contest: Contest };
    }>(`/api/contests/${id}`)
      .then((d) => {
        setContest(d.data.contest);
      })
      .catch(() => {
        setContest(null);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingUsers(true);
    apiGet<{ success: boolean; data: { recommendedUsers: RecommendedUser[] } }>(
      `/api/contests/${id}/recommended-users`
    )
      .then((d) => setRecommendedUsers(d.data.recommendedUsers))
      .catch(() => setRecommendedUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [id]);

  const handleNudge = async () => {
    if (!user) {
      setToast("로그인이 필요해요.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (!selectedTargetId) {
      setToast("대상을 선택해 주세요.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    try {
      setSending(true);
      await apiPost<{ nudge: unknown }>("/api/messages/nudge", {
        toUserId: selectedTargetId,
        contestId: id,
        message: "같이 이 대회 나가보실래요?",
      });
      setToast("가볍게 제안(찔러보기)을 보냈어요.");
      // 찔러보기 성공 후 메신저로 리다이렉트
      if (selectedTargetId) {
        setTimeout(() => {
          navigate(`/messenger?user=${selectedTargetId}`);
        }, 1500);
      }
    } catch (error: any) {
      // 서버에서 보낸 실제 에러 메시지 사용
      const errorMessage =
        error.message || "전송에 실패했어요. 잠시 후 다시 시도해주세요.";
      setToast(errorMessage);
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const RecommendedUserCard = ({ user }: { user: RecommendedUser }) => {
    const getMatchScoreColor = (score: number) => {
      switch (score) {
        case 3:
          return "bg-green-100 text-green-800";
        case 2:
          return "bg-yellow-100 text-yellow-800";
        default:
          return "bg-blue-100 text-blue-800";
      }
    };

    const getMatchScoreText = (score: number) => {
      switch (score) {
        case 3:
          return "높은 매칭";
        case 2:
          return "보통 매칭";
        default:
          return "기본 매칭";
      }
    };

    return (
      <div
        className={`flex flex-col items-center rounded-xl border-2 px-4 py-4 cursor-pointer transition-all ${
          selectedTargetId === user.id
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => setSelectedTargetId(user.id)}
      >
        <div className="h-20 w-20 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
          {user.name.charAt(0)}
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium text-slate-900">{user.name}</div>
          <div className="text-xs text-slate-500">
            {user.job_field || "직군 미설정"}
          </div>
          <div className="text-xs text-slate-500">{user.region}</div>
          {user.school && (
            <div className="text-xs text-slate-400">{user.school}</div>
          )}
          <div
            className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getMatchScoreColor(
              user.match_score
            )}`}
          >
            {getMatchScoreText(user.match_score)}
          </div>
        </div>
        {user.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {user.skills.slice(0, 2).map((skill, index) => (
              <span
                key={index}
                className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600"
              >
                {skill}
              </span>
            ))}
            {user.skills.length > 2 && (
              <span className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600">
                +{user.skills.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">
            {contest?.title ?? "대회 상세"}
          </h1>
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-slate-400">
            저장
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            {contest?.image_url ? (
              <img
                src={contest.image_url}
                alt={contest.title}
                className="w-full h-auto rounded-xl object-contain"
              />
            ) : (
              <div className="h-64 w-full rounded-xl bg-slate-200" />
            )}
          </div>
          <div className="lg:col-span-3 space-y-8">
            <section className="space-y-2">
              <h2 className="text-3xl font-bold">행사 개요</h2>
              <p className="text-sm text-slate-600">{contest?.title ?? "-"}</p>
              <p className="text-sm text-slate-600">{contest?.host ?? "-"}</p>
              <p className="text-sm text-slate-600">{contest?.format ?? "-"}</p>
              <p className="text-sm text-slate-600">
                {contest?.features ?? "-"}
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-3xl font-bold">공모전/대회 특성</h2>
              <p className="text-sm text-slate-600">{contest?.topic ?? "-"}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-3xl font-bold">필요한 역량</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {contest?.required_skills || "-"}
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-3xl font-bold">팀 구성 추천</h2>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {contest?.team_composition || "-"}
              </p>
            </section>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">추천 팀원</h2>
          {loadingUsers ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center rounded-xl border border-slate-200 px-4 py-4"
                >
                  <div className="h-20 w-20 rounded-full bg-slate-200 animate-pulse" />
                  <div className="mt-2 h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="mt-1 h-3 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : recommendedUsers.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {recommendedUsers.map((user) => (
                <RecommendedUserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-500">
                <p className="text-lg">추천할 수 있는 사용자가 없습니다.</p>
                <p className="mt-2 text-sm">
                  아직 가입한 사용자가 적거나 조건에 맞는 사용자가 없습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {user && recommendedUsers.length > 0 && (
          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={handleNudge}
              disabled={sending || !selectedTargetId}
              className="rounded-md bg-slate-900 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending
                ? "보내는 중..."
                : selectedTargetId
                ? "선택한 대상에게 찔러보기"
                : "대상 선택 후 찔러보기"}
            </button>
          </div>
        )}
        {toast && (
          <div className="mt-4 text-center text-sm text-emerald-700">
            {toast}
          </div>
        )}
      </Container>
      <AppFooter />
    </div>
  );
};

export default ContestDetailPage;
