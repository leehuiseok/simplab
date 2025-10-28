import { useEffect, useState } from "react";
import Container from "../../shared/ui/Container";
import Navbar from "../../widgets/navbar/Navbar";
import AppFooter from "../../widgets/footer/AppFooter";
import { apiGet, apiPost } from "../../shared/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
  message_type?: string;
  is_read?: boolean;
  read_at?: string;
}

interface DirectConversation {
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  last_message: string;
  last_message_at: string;
  last_message_read?: boolean;
  unread_count?: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  current_members: number;
  max_members: number;
  created_at: string;
  updated_at: string;
}

interface TeamMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

type ChatType = "direct" | "team";

const MessengerPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [chatType, setChatType] = useState<ChatType>("direct");

  // 1대1 채팅 관련 상태
  const [directConversations, setDirectConversations] = useState<
    DirectConversation[]
  >([]);
  const [activeDirectUserId, setActiveDirectUserId] = useState<string | null>(
    null
  );
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);

  // 팀 채팅 관련 상태
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);

  // 공통 상태
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 1대1 채팅 목록 로드
  useEffect(() => {
    if (!user || chatType !== "direct") return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: DirectConversation[] } }>(
          `/api/messages/direct`
        );
        setDirectConversations(data.data.messages);

        // URL 파라미터에서 특정 사용자 ID가 있으면 해당 사용자와의 채팅을 열기
        const targetUserId = searchParams.get("user");
        if (targetUserId) {
          setActiveDirectUserId(targetUserId);
        } else if (data.data.messages.length > 0) {
          setActiveDirectUserId(data.data.messages[0].other_user_id);
        }
      } catch (error) {
        console.error("1대1 채팅 목록 로드 실패:", error);
      }
    })();
  }, [user, chatType, searchParams]);

  // 팀 목록 로드
  useEffect(() => {
    if (!user || chatType !== "team") return;
    (async () => {
      try {
        const data = await apiGet<{ data: { teams: Team[] } }>(
          `/api/teams/my-teams`
        );
        setTeams(data.data.teams);
        if (data.data.teams.length > 0) {
          setActiveTeamId(data.data.teams[0].id);
        }
      } catch (error) {
        console.error("팀 목록 로드 실패:", error);
      }
    })();
  }, [user, chatType]);

  // 1대1 채팅 메시지 로드
  useEffect(() => {
    if (!activeDirectUserId || chatType !== "direct") return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: DirectMessage[] } }>(
          `/api/messages/direct/${activeDirectUserId}`
        );
        setDirectMessages(data.data.messages);
      } catch (error) {
        console.error("1대1 메시지 로드 실패:", error);
      }
    })();
  }, [activeDirectUserId, chatType]);

  // 팀 채팅 메시지 로드
  useEffect(() => {
    if (!activeTeamId || chatType !== "team") return;
    (async () => {
      try {
        const data = await apiGet<{ data: { messages: TeamMessage[] } }>(
          `/api/messages/team/${activeTeamId}`
        );
        setTeamMessages(data.data.messages);
      } catch (error) {
        console.error("팀 메시지 로드 실패:", error);
      }
    })();
  }, [activeTeamId, chatType]);

  const sendDirectMessage = async () => {
    if (!user || !activeDirectUserId || !input.trim()) return;
    setLoading(true);
    try {
      const data = await apiPost<{ data: { message: DirectMessage } }>(
        `/api/messages/direct`,
        {
          receiver_id: activeDirectUserId,
          content: input,
        }
      );
      setDirectMessages((prev) => [...prev, data.data.message]);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  const sendTeamMessage = async () => {
    if (!user || !activeTeamId || !input.trim()) return;
    setLoading(true);
    try {
      const data = await apiPost<{ data: { message: TeamMessage } }>(
        `/api/messages/team/${activeTeamId}`,
        {
          content: input,
        }
      );
      setTeamMessages((prev) => [...prev, data.data.message]);
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Container className="py-8">
        {/* 탭 헤더 */}
        <div className="mb-6">
          <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 w-fit">
            <button
              onClick={() => setChatType("direct")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chatType === "direct"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1대1 채팅
            </button>
            <button
              onClick={() => setChatType("team")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chatType === "team"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              팀 채팅
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* 사이드바 - 채팅 목록 */}
          <aside className="lg:col-span-1 space-y-2">
            <h2 className="text-lg font-semibold">
              {chatType === "direct" ? "1대1 대화" : "팀 채팅"}
            </h2>
            <div className="divide-y rounded-lg border border-slate-200">
              {chatType === "direct"
                ? // 1대1 채팅 목록
                  directConversations.map((conversation) => {
                    const selected =
                      conversation.other_user_id === activeDirectUserId;
                    return (
                      <button
                        key={conversation.other_user_id}
                        onClick={() =>
                          setActiveDirectUserId(conversation.other_user_id)
                        }
                        className={`w-full text-left px-4 py-3 relative ${
                          selected ? "bg-slate-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">
                            {conversation.other_user_name}
                          </div>
                          {conversation.unread_count &&
                            conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {conversation.unread_count}
                              </span>
                            )}
                        </div>
                        <div
                          className={`text-xs truncate ${
                            conversation.unread_count &&
                            conversation.unread_count > 0
                              ? "text-slate-900 font-medium"
                              : "text-slate-500"
                          }`}
                        >
                          {conversation.last_message}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(
                            conversation.last_message_at
                          ).toLocaleString()}
                        </div>
                      </button>
                    );
                  })
                : // 팀 채팅 목록
                  teams.map((team) => {
                    const selected = team.id === activeTeamId;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setActiveTeamId(team.id)}
                        className={`w-full text-left px-4 py-3 ${
                          selected ? "bg-slate-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-medium">{team.name}</div>
                        <div className="text-xs text-slate-500">
                          {team.current_members}/{team.max_members}명
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(team.updated_at).toLocaleString()}
                        </div>
                      </button>
                    );
                  })}

              {/* 빈 상태 메시지 */}
              {((chatType === "direct" && directConversations.length === 0) ||
                (chatType === "team" && teams.length === 0)) && (
                <div className="px-4 py-6 text-sm text-slate-500">
                  {chatType === "direct"
                    ? "1대1 대화가 없습니다."
                    : "참여한 팀이 없습니다."}
                </div>
              )}
            </div>
          </aside>

          {/* 메인 채팅 영역 */}
          <main className="lg:col-span-3">
            <div className="h-[60vh] rounded-lg border border-slate-200 p-4 overflow-y-auto">
              {chatType === "direct"
                ? // 1대1 채팅 메시지
                  directMessages.map((message) => {
                    const isNudgeMessage =
                      message.content.includes(
                        "공모전에 함께 참가해보시겠어요?"
                      ) ||
                      message.content.includes("같이 이 대회 나가보실래요?") ||
                      message.content.includes("안녕하세요!");
                    const isOwnMessage = message.sender_id === user?.id;

                    return (
                      <div
                        key={message.id}
                        className={`mb-3 ${
                          isOwnMessage ? "text-right" : "text-left"
                        }`}
                      >
                        <div className="text-xs text-slate-500 mb-1">
                          {message.sender_name}
                          {isNudgeMessage && !isOwnMessage && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">
                              💌 찔러보기
                            </span>
                          )}
                        </div>
                        <div
                          className={`inline-block rounded-lg px-3 py-2 text-sm ${
                            isOwnMessage
                              ? "bg-slate-900 text-white"
                              : isNudgeMessage
                              ? "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
                              : "bg-slate-100"
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(message.created_at).toLocaleString()}
                          {isOwnMessage && message.is_read && (
                            <span className="ml-2 text-green-500">✓ 읽음</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                : // 팀 채팅 메시지
                  teamMessages.map((message) => (
                    <div key={message.id} className="mb-3 text-left">
                      <div className="text-xs text-slate-500 mb-1">
                        {message.sender_name}
                      </div>
                      <div className="inline-block rounded-lg px-3 py-2 text-sm bg-slate-100">
                        {message.content}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}

              {/* 빈 상태 메시지 */}
              {((chatType === "direct" && directMessages.length === 0) ||
                (chatType === "team" && teamMessages.length === 0)) && (
                <div className="h-full grid place-items-center text-slate-500 text-sm">
                  메시지가 없습니다.
                </div>
              )}
            </div>

            {/* 메시지 입력 영역 */}
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지를 입력하세요"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    chatType === "direct"
                      ? sendDirectMessage()
                      : sendTeamMessage();
                  }
                }}
              />
              <button
                onClick={
                  chatType === "direct" ? sendDirectMessage : sendTeamMessage
                }
                disabled={
                  loading ||
                  (chatType === "direct" ? !activeDirectUserId : !activeTeamId)
                }
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                보내기
              </button>
            </div>
          </main>
        </div>
      </Container>
      <AppFooter />
    </div>
  );
};

export default MessengerPage;
