import Container from "../../shared/ui/Container";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "@/shared/api";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  image_url?: string | null;
};

const ContestCard = ({ c }: { c: Contest }) => {
  return (
    <Link
      to={`/contests/${c.id}`}
      className="card-hover group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg hover:border-blue-300 hover:shadow-xl"
    >
      <div className="relative">
        <div className="aspect-[3/4] w-full bg-white flex items-center justify-center p-2">
          {c.image_url ? (
            <img
              src={c.image_url}
              alt={c.title}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-6xl">🏆</span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          <div className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {c.title}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {c.topic ?? "주제 미정"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {c.region ?? "지역 미정"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">
            {c.deadline
              ? `마감 ${new Date(c.deadline).toLocaleDateString()}`
              : "마감 미정"}
          </div>
          <div className="text-xs text-slate-500">자세히 보기 →</div>
        </div>
      </div>
    </Link>
  );
};

const ContestList = () => {
  const [contests, setContests] = useState<Contest[]>([]);

  useEffect(() => {
    apiGet<{ success: boolean; data: { contests: Contest[] } }>("/api/contests")
      .then((d) => setContests(d.data.contests))
      .catch((error) => {
        console.error("공모전 목록을 불러오는데 실패했습니다:", error);
        setContests([]);
      });
  }, []);

  return (
    <section className="bg-gradient-to-br from-slate-50 to-white py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            인기 공모전
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            다양한 분야의 공모전에서 당신의 실력을 뽐내보세요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {contests.slice(0, 8).map((c) => (
            <ContestCard key={c.id} c={c} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/contests"
            className="btn-animate inline-flex items-center gap-2 rounded-xl border-2 border-purple-300 bg-white px-8 py-4 text-lg font-semibold text-purple-700 shadow-lg hover:border-purple-400 hover:bg-purple-50 hover:shadow-xl focus-ring"
          >
            모든 공모전 보기
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default ContestList;
