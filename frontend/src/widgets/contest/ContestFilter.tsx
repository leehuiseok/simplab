import { useAuth } from "../../contexts/AuthContext";

export interface FilterOptions {
  region: string;
  topic: string;
  skills: string[];
}

interface ContestFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const ContestFilter = ({
  onFilterChange,
  currentFilters,
}: ContestFilterProps) => {
  const { user } = useAuth();

  // 지역 옵션
  const regionOptions = [
    "서울",
    "경기",
    "인천",
    "부산",
    "대구",
    "광주",
    "대전",
    "울산",
    "세종",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];

  // 관심분야 옵션
  const topicOptions = [
    "AI/인공지능",
    "웹개발",
    "모바일앱",
    "게임",
    "보안",
    "블록체인",
    "IoT",
    "빅데이터",
    "클라우드",
    "AR/VR",
    "로봇공학",
    "바이오테크",
    "금융",
    "교육",
    "의료",
    "환경",
    "사회공헌",
    "스타트업",
  ];

  // 역량 옵션
  const skillOptions = [
    "프론트엔드",
    "백엔드",
    "풀스택",
    "데이터분석",
    "AI/ML",
    "디자인",
    "기획",
    "마케팅",
    "비즈니스",
    "프로젝트관리",
    "연구",
    "발표",
  ];

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | string[]
  ) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFilterChange(newFilters);
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = currentFilters.skills.includes(skill)
      ? currentFilters.skills.filter((s) => s !== skill)
      : [...currentFilters.skills, skill];
    handleFilterChange("skills", newSkills);
  };

  const clearFilters = () => {
    onFilterChange({
      region: "",
      topic: "",
      skills: [],
    });
  };

  const hasActiveFilters =
    currentFilters.region ||
    currentFilters.topic ||
    currentFilters.skills.length > 0;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">필터링</h3>
        <p className="text-sm text-slate-600 mt-1">조건을 선택해주세요</p>
      </div>

      <div className="space-y-6">
        {/* 사용자 정보 기반 추천 */}
        {user && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">
              내 정보 기반 추천
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex flex-wrap gap-1">
                {user.region && (
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange("region", user.region || "")
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    📍 {user.region}
                  </button>
                )}
                {user.job_field && (
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange("topic", user.job_field || "")
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    🎯 {user.job_field}
                  </button>
                )}
                {user.skills && (
                  <button
                    type="button"
                    onClick={() => {
                      const userSkills =
                        user.skills?.split(",").map((s) => s.trim()) || [];
                      handleFilterChange("skills", userSkills);
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    💪 내 역량으로 찾기
                  </button>
                )}
              </div>
              <div className="text-xs text-blue-600">
                내 정보로 빠르게 필터링하기
              </div>
            </div>
          </div>
        )}

        {/* 지역 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            📍 지역
          </label>
          <select
            value={currentFilters.region}
            onChange={(e) => handleFilterChange("region", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 지역</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* 관심분야 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🎯 관심분야
          </label>
          <select
            value={currentFilters.topic}
            onChange={(e) => handleFilterChange("topic", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">전체 분야</option>
            {topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* 역량 필터 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            💪 필요 역량 (다중 선택 가능)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  currentFilters.skills.includes(skill)
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestFilter;
