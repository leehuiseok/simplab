import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import Container from "../../shared/ui/Container";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiGet, apiPost } from "../../shared/api";
import { TRAITS_OPTIONS } from "../../shared/traits";

interface Award {
  id?: string;
  title: string;
  awardedAt: string;
  description: string;
}

export const ProfileForm = () => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"awards" | "portfolio" | "traits">(
    "portfolio"
  );
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, string[]>
  >({});

  const [newAward, setNewAward] = useState<Award>({
    title: "",
    awardedAt: "",
    description: "",
  });

  const toggleTrait = (category: string, value: string) => {
    setSelectedTraits((prev) => {
      const current = new Set(prev[category] ?? []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [category]: Array.from(current) };
    });
  };

  const addAward = () => {
    if (newAward.title && newAward.awardedAt && newAward.description) {
      setAwards((prev) => [...prev, { ...newAward }]);
      setNewAward({ title: "", awardedAt: "", description: "" });
    }
  };

  const removeAward = (index: number) => {
    setAwards((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchAwards = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiGet<{
        success: boolean;
        data: { awards: Award[] };
      }>("/api/profile/awards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data.awards) {
        setAwards(response.data.awards);
      }
    } catch (error) {
      console.error("수상경력 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "awards") {
      fetchAwards();
    }
  }, [tab, fetchAwards]);

  const saveProfile = async () => {
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSaving(true);
    try {
      // 수상경력 저장
      if (awards.length > 0) {
        await apiPost(
          "/api/profile/awards",
          { awards },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // 성향 저장
      if (Object.keys(selectedTraits).length > 0) {
        await apiPost(
          "/api/profile/traits",
          { traits: selectedTraits },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      alert("프로필이 성공적으로 저장되었습니다!");

      // 저장 후 수상경력 다시 불러오기
      if (tab === "awards") {
        await fetchAwards();
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-100 p-6">
      {/* Tabs */}
      <div className="mb-6 flex gap-6 text-sm">
        {[
          { key: "awards", label: "수상경력" },
          { key: "portfolio", label: "포트폴리오" },
          { key: "traits", label: "성향" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as "awards" | "portfolio" | "traits")}
            className={`border-b-2 pb-1 font-semibold ${
              tab === t.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contents */}
      {tab === "portfolio" && (
        <div className="space-y-8 text-sm text-slate-800">
          <div>
            <div className="font-semibold">
              개발자의 경우 깃허브 링크(노션, 피그마 등등)
            </div>
            <div className="mt-1 text-slate-600">
              이미지 첨부 (내 프로필에서 작은 아이콘으로 주르륵 뜨게끔)
            </div>
          </div>

          <div>
            <div className="font-semibold">프로젝트 (여러개 입력 가능)</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <input
                  className="w-full rounded border border-slate-300 p-2"
                  placeholder="프로젝트 이름, 기간"
                />
                <input
                  className="w-full rounded border border-slate-300 p-2"
                  placeholder="참여 형태(팀, 개인/대회, 수업, 사이드프로젝트 등)"
                />
                <textarea
                  className="h-24 w-full rounded border border-slate-300 p-2"
                  placeholder="내용"
                />
              </div>
              <div className="space-y-2">
                <textarea
                  className="h-24 w-full rounded border border-slate-300 p-2"
                  placeholder="개인 기여도 (역할·구체적 기여 내용)"
                />
                <input
                  className="w-full rounded border border-slate-300 p-2"
                  placeholder="결과물링크(깃, 피그마, 배포, 노션 등)"
                />
                <input
                  className="w-full rounded border border-slate-300 p-2"
                  placeholder="사용한 기술 스택(체크리스트 or 태그)"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold">자격증</div>
            <input
              className="mt-2 w-full rounded border border-slate-300 p-2"
              placeholder="예: 정보처리기사 (2025.06 취득)"
            />
          </div>
        </div>
      )}

      {tab === "awards" && (
        <div className="space-y-6 text-sm">
          {loading && (
            <div className="text-center py-4 text-slate-600">
              수상경력을 불러오는 중...
            </div>
          )}
          {/* 수상경력 추가 폼 */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="font-semibold">대회 이름</label>
              <input
                className="w-full rounded border border-slate-300 p-2"
                value={newAward.title}
                onChange={(e) =>
                  setNewAward((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="대회명을 입력하세요"
              />
              <label className="font-semibold">수상 날짜</label>
              <input
                type="date"
                className="w-full rounded border border-slate-300 p-2"
                value={newAward.awardedAt}
                onChange={(e) =>
                  setNewAward((prev) => ({
                    ...prev,
                    awardedAt: e.target.value,
                  }))
                }
              />
              <button
                onClick={addAward}
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                추가
              </button>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="font-semibold">내용/내 역할</label>
              <textarea
                className="h-32 w-full rounded border border-slate-300 p-2"
                value={newAward.description}
                onChange={(e) =>
                  setNewAward((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="수상 내용과 본인의 역할을 설명하세요"
              />
            </div>
          </div>

          {/* 추가된 수상경력 목록 */}
          {awards.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">
                수상 경력 ({awards.length}개)
              </h3>
              <div className="space-y-3">
                {awards.map((award, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{award.title}</div>
                        <div className="text-xs text-slate-600">
                          {new Date(award.awardedAt).toLocaleDateString()}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {award.description}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAward(index)}
                        className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "traits" && (
        <div className="space-y-8 text-sm">
          {Object.entries(TRAITS_OPTIONS).map(([category, options]) => (
            <div key={category}>
              <div className="mb-3 font-semibold">
                {category.replaceAll("_", " ")}
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const active = (selectedTraits[category] ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleTrait(category, opt)}
                      className={`rounded-full border px-3 py-1 ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="mb-2 font-semibold">일주일 내 가용 시간</div>
            <input
              className="w-full rounded border border-slate-300 p-2"
              placeholder="예: 평일 저녁 2시간, 주말 4시간"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};

const ProfileEditor = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        <ProfileForm />
      </Container>
      <AppFooter />
    </div>
  );
};

export default ProfileEditor;
