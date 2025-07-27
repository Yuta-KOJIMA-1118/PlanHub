// src/components/JoinOrCreateTeam.tsx
import { useState } from "react"
import axios from "axios"

export default function JoinOrCreateTeam() {
  const [teamIdInput, setTeamIdInput] = useState("")
  const [newTeamName, setNewTeamName] = useState("")

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const handleJoin = async () => {
    if (!teamIdInput) {
      alert("参加するチームIDを入力してください。")
      return
    }

    try {
      const response = await axios.post(
        `${backendURL}/api/teams/join`, // 参加用エンドポイント
        {
          team_id: teamIdInput // チームIDをバックエンドに送信
        },
        { withCredentials: true } // Cookieを有効にする
      )

      console.log('チーム参加成功', response.data)
      alert(`チームID ${teamIdInput} に参加しました！`)
      window.location.reload() // 成功したらページをリロード
    } catch (error: any) {
      console.error('チーム参加失敗', error.response?.data || error.message)
      const errorMessages = error.response?.data?.errors?.join(', ') || error.message
      alert(`チーム参加に失敗しました: ${errorMessages}`)
    }
  }

  const handleCreate = async () => {
    if (!newTeamName) {
      alert("チーム名を入力してください。")
      return
    }

    try {
      const response = await axios.post(
        `${backendURL}/api/teams`,
        {
          team: { name: newTeamName }
        },
        { withCredentials: true }
      )

      console.log('チーム作成成功', response.data)
      alert(`新しいチーム「${response.data.team.name}」を作成し、参加しました！`)
      window.location.reload()
    } catch (error: any) {
      console.error('チーム作成失敗', error.response?.data || error.message)
      const errorMessages = error.response?.data?.errors?.join(', ') || error.message
      alert(`チーム作成に失敗しました: ${errorMessages}`)
    }
  }

  return (
    <div style={{ marginTop: "2rem", textAlign: "center" }}>
      <h2>チームに参加または新規作成</h2>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="参加するチームIDを入力"
          value={teamIdInput}
          onChange={(e) => setTeamIdInput(e.target.value)}
        />
        <button onClick={handleJoin} style={{ marginLeft: "0.5rem" }}>
          チームに参加
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="新しいチーム名を入力"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={handleCreate}>新しくチームを作成</button>
      </div>
    </div>
  )
}