// src/pages/CalendarPage.tsx
import { useEffect, useState } from "react"
import CalendarView from "../components/CalendarView"
import JoinOrCreateTeam from "../components/JoinOrCreateTeam"
import "./Calendar.css"
import axios from "axios"

// 新しい型定義: ユーザー情報とチーム情報を含む
interface UserData {
  id: number;
  email: string;
  name: string;
  team_id: number | null;
  team_name: string | null;
}

// チーム情報表示用のコンポーネント
interface TeamInfoDisplayProps {
  teamId: number;
  teamName: string;
  currentUserId: number;
  currentUserTeamId: number | null;
}

const TeamInfoDisplay: React.FC<TeamInfoDisplayProps> = ({ teamId, teamName, currentUserId, currentUserTeamId }) => {
  console.log("TeamInfoDisplay: Rendering with currentUserId", currentUserId, "currentUserTeamId", currentUserTeamId);
  return (
    <div>
      <h2>所属チーム: {teamName} (ID: {teamId})</h2>
      <CalendarView currentUserId={currentUserId} currentUserTeamId={currentUserTeamId} />
    </div>
  );
};


export default function CalendarPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  useEffect(() => {
    const fetchUserTeamStatus = async () => {
      try {
        const response = await axios.get(`${backendURL}/api/me`, { withCredentials: true });
        setUserData(response.data);
      } catch (error: any) {
        console.error("ユーザー情報の取得に失敗しました", error.response?.data || error.message);
        setUserData(null);
        alert("ユーザー情報の取得に失敗しました。再度ログインしてください。");
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeamStatus();
  }, [backendURL]);

  console.log("CalendarPage: Rendering with userData:", userData);

  return (
    <div className="calendar-container">
      <h1 className="calendar-title">PlanHub</h1>
      {loading ? (
        <p>読み込み中...</p>
      ) : userData && userData.id && userData.team_id ? ( // <- ここを修正：userData.team_id が null でないことを確認
        // ユーザーデータがあり、かつ team_id が null でない場合（チームに所属している場合）
        <TeamInfoDisplay
          teamId={userData.team_id} // team_id は必ず number 型になる
          teamName={userData.team_name || "チーム名なし"} // team_name も null の可能性があるが、このブロックでは team_id があるので空文字回避
          currentUserId={userData.id}
          currentUserTeamId={userData.team_id}
        />
      ) : (
        // ユーザーデータが null の場合（ロードエラー）、または team_id が null の場合（チーム未所属）
        <JoinOrCreateTeam />
      )}
    </div>
  );
}