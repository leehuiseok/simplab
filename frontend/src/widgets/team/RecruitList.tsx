import Container from "../../shared/ui/Container";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "@/shared/api";

type Team = {
  id: string;
  name: string;
  area?: string | null;
  region?: string | null;
  image_url?: string | null;
};

const RecruitCard = ({ t }: { t: Team }) => {
  return (
    <Link
      to={`/team/${t.id}`}
      className="card-hover group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg hover:border-blue-300 hover:shadow-xl"
    >
      <div className="flex items-start gap-4">
        {t.image_url ? (
          <img
            src={t.image_url}
            alt={t.name}
            className="h-16 w-16 rounded-2xl object-cover shadow-md"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            {t.name}
          </div>
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {t.area ?? "분야 미정"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              {t.region ?? "지역 미정"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const RecruitList = () => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    apiGet<{ success: boolean; data: { teams: Team[] } }>("/api/teams")
      .then((d) => setTeams(d.data.teams))
      .catch((error) => {
        console.error("팀 목록을 불러오는데 실패했습니다:", error);
        setTeams([]);
      });
  }, []);
  return (
    <section className="bg-gradient-to-br from-white to-slate-50 py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">팀 모집</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            다양한 분야의 팀들이 당신을 기다리고 있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {teams.slice(0, 6).map((t) => (
            <RecruitCard key={t.id} t={t} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/team"
            className="btn-animate inline-flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-8 py-4 text-lg font-semibold text-blue-700 shadow-lg hover:border-blue-400 hover:bg-blue-50 hover:shadow-xl focus-ring"
          >
            모든 팀 보기
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

export default RecruitList;
