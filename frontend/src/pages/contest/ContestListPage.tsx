import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import ContestFilter, {
  type FilterOptions,
} from "../../widgets/contest/ContestFilter";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiGet } from "@/shared/api";

type Contest = {
  id: string;
  title: string;
  topic?: string | null;
  region?: string | null;
  deadline?: string | null;
  image_url?: string | null;
};

type ContestResponse = {
  success: boolean;
  data: { contests: Contest[] };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const ContestCard = ({ c }: { c: Contest }) => {
  return (
    <Link
      to={`/contests/${c.id}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300"
    >
      <div className="aspect-[3/4] w-full bg-white flex items-center justify-center">
        {c.image_url ? (
          <img
            src={c.image_url}
            alt={c.title}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
      </div>
      <div className="p-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">{c.title}</div>
          <div className="text-xs text-slate-600">
            {c.topic ?? "-"} · {c.region ?? "-"}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-slate-700">
            {c.deadline
              ? `마감 ${new Date(c.deadline).toLocaleDateString()}`
              : "마감 미정"}
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-slate-400"
            onClick={(e) => e.preventDefault()}
          >
            저장
          </button>
        </div>
      </div>
    </Link>
  );
};

const ContestListPage = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    region: "",
    topic: "",
    skills: [],
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastContestElementRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  const buildQueryString = useCallback(
    (pageNum: number, currentFilters: FilterOptions) => {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "8",
      });

      if (currentFilters.region) {
        params.append("region", currentFilters.region);
      }
      if (currentFilters.topic) {
        params.append("topic", currentFilters.topic);
      }
      if (currentFilters.skills.length > 0) {
        currentFilters.skills.forEach((skill) => {
          params.append("skills", skill);
        });
      }

      return params.toString();
    },
    []
  );

  const loadContests = useCallback(
    async (pageNum: number, append = false) => {
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setLoading(true);
      try {
        const queryString = buildQueryString(pageNum, filters);
        const response = await apiGet<ContestResponse>(
          `/api/contests?${queryString}`
        );
        const newContests = response.data.contests;

        if (append) {
          setContests((prev) => [...prev, ...newContests]);
        } else {
          setContests(newContests);
        }

        setHasMore(pageNum < response.pagination.totalPages);
        setCurrentPage(pageNum);
      } catch (error) {
        console.error("공모전 목록을 불러오는데 실패했습니다:", error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [filters, buildQueryString]
  );

  useEffect(() => {
    loadContests(1, false);
  }, [loadContests]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    // 필터 변경 시 첫 페이지부터 다시 로드
    setCurrentPage(1);
    setContests([]);
    setHasMore(true);
  }, []);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    if (currentPage === 1) {
      loadContests(1, false);
    }
  }, [filters, loadContests, currentPage]);

  const lastContestElementCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingRef.current || !hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          const nextPage = currentPage + 1;
          loadContests(nextPage, true);
        }
      });

      if (node) observerRef.current.observe(node);
      lastContestElementRef.current = node;
    },
    [hasMore, currentPage, loadContests]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Container className="py-10">
        <div className="flex flex-col gap-8">
          {/* 상단 필터 바 */}
          <div className="w-full">
            <ContestFilter
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">공모전/대회</h1>

              {(filters.region ||
                filters.topic ||
                filters.skills.length > 0) && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">적용된 필터:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.region && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          📍 {filters.region}
                        </span>
                      )}
                      {filters.topic && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          🎯 {filters.topic}
                        </span>
                      )}
                      {filters.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                        >
                          💪 {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {contests.map((c, index) => {
                if (contests.length === index + 1) {
                  return (
                    <div key={c.id} ref={lastContestElementCallback}>
                      <ContestCard c={c} />
                    </div>
                  );
                }
                return <ContestCard key={c.id} c={c} />;
              })}
            </div>

            {loading && (
              <div className="mt-8 text-center text-slate-500">
                공모전을 더 불러오는 중...
              </div>
            )}

            {!hasMore && contests.length > 0 && (
              <div className="mt-8 text-center text-slate-500">
                모든 공모전을 불러왔습니다.
              </div>
            )}

            {contests.length === 0 && !loading && (
              <div className="mt-8 text-center text-slate-500">
                공모전이 없습니다.
              </div>
            )}
          </div>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default ContestListPage;
