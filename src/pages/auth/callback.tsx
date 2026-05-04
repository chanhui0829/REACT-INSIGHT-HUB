import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { checkNickname } from "@/services/authService";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nicknameError, setNicknameError] = useState("");
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("세션 처리 오류", sessionError);
        toast.error("로그인 처리 중 오류가 발생했습니다.");
        navigate("/sign-in");
        return;
      }

      const user = session.user;
      setUserId(user.id);

      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("nickname")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        console.error("사용자 정보 조회 오류", userError);
        toast.error("사용자 정보 조회 중 오류가 발생했습니다.");
        navigate("/sign-in");
        return;
      }

      if (!userData.nickname) {
        setShowNicknameModal(true);
        setLoading(false);
      } else {
        toast.success("로그인을 성공하였습니다.");
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleNicknameSubmit = async () => {
    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      toast.error("닉네임은 2자 이상 20자 이하로 입력해주세요.");
      return;
    }

    if (!userId) return;

    setIsCheckingNickname(true);
    const isDuplicate = await checkNickname(nickname);
    setIsCheckingNickname(false);

    if (isDuplicate) {
      setNicknameError("이미 사용 중인 닉네임입니다.");
      return;
    }

    const { error } = await supabase
      .from("user")
      .update({ nickname })
      .eq("id", userId);

    if (error) {
      toast.error("닉네임 저장에 실패했습니다.");
      return;
    }

    toast.success("로그인을 성공하였습니다.");
    navigate("/");
  };

  if (loading) {
    return (
      <main className="w-full h-full min-h-[720px] flex items-center justify-center">
        <p>로그인을 진행 중입니다. 잠시만 기다려주세요.</p>
      </main>
    );
  }

  if (showNicknameModal) {
    return (
      <main className="w-full h-full min-h-[720px] flex items-center justify-center bg-zinc-950">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">닉네임 설정</h2>
          <p className="text-zinc-400 mb-6">
            서비스 이용을 위해 닉네임을 설정해주세요.
          </p>
          <Input
            placeholder="2자 이상 20자 이하"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setNicknameError("");
            }}
            className="h-12 rounded-xl bg-zinc-950 border-zinc-700 text-white mb-2"
          />
          {nicknameError && <p className="text-xs text-red-400 mb-4">{nicknameError}</p>}
          {isCheckingNickname && <p className="text-xs text-zinc-500 mb-4">중복 검사 중...</p>}
          <Button
            onClick={handleNicknameSubmit}
            disabled={isCheckingNickname}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCheckingNickname ? "검사 중..." : "시작하기"}
          </Button>
        </div>
      </main>
    );
  }

  return null;
}
