import React, { useEffect, useState } from 'react'
import axios from 'axios'

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

type Member = {
  id: number
  name: string
}

type Props = {
  viewMode: 'self' | 'team'
  selectedMembers: number[] // <- string[] から number[] に変更
  setViewMode: (mode: 'self' | 'team') => void
  setSelectedMembers: React.Dispatch<React.SetStateAction<number[]>> // <- string[] から number[] に変更
  currentUserId: number
  currentUserTeamId: number | null
}

export default function ViewModeSelector({
  viewMode,
  selectedMembers,
  setViewMode,
  setSelectedMembers,
  currentUserId,
  currentUserTeamId,
}: Props) {
  const [teamMembers, setTeamMembers] = useState<Member[]>([])
  const [error, setError] = useState<string>("")

  // チームメンバーの取得
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!currentUserTeamId) {
        setTeamMembers([])
        return
      }
      try {
        console.log(`ViewModeSelector: Fetching team members for team ID: ${currentUserTeamId}`); // デバッグログ
        const response = await axios.get(`${backendURL}/api/teams/${currentUserTeamId}/members`, {
          withCredentials: true,
        })
        setTeamMembers(response.data)
        console.log("ViewModeSelector: チームメンバー取得成功", response.data); // デバッグログ
      } catch (err: any) {
        console.error('ViewModeSelector: メンバー取得エラー:', err.response?.data || err.message)
        setError('チームメンバーの取得に失敗しました')
        setTeamMembers([])
      }
    }
    fetchTeamMembers()
  }, [currentUserTeamId, backendURL]) // backendURLも依存に含める

  // viewMode が 'self' になったときに自分だけを選択状態にする
  useEffect(() => {
    if (viewMode === 'self') {
      setSelectedMembers([currentUserId])
    }
  }, [viewMode, currentUserId, setSelectedMembers])


  const toggleMember = (memberId: number) => { // <- memberName から memberId に変更
    setSelectedMembers((prev) =>
      prev.includes(memberId) // <- memberId で比較
        ? prev.filter((m) => m !== memberId) // <- memberId でフィルタリング
        : [...prev, memberId]
    )
  }

  // 「自分のみ表示」を選択した時のハンドラー
  const handleSelfModeChange = () => {
    setViewMode('self')
    setSelectedMembers([currentUserId]) // 自分のみを選択状態に設定
  }

  // 「他のメンバーを含む」を選択した時のハンドラー
  const handleTeamModeChange = () => {
    setViewMode('team')
    // デフォルトで自分を選択状態に含める (他のメンバーも選択できる状態)
    setSelectedMembers((prev) => {
      if (!prev.includes(currentUserId)) {
        return [...prev, currentUserId]
      }
      return prev
    })
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label>
        <input
          type="radio"
          value="self"
          checked={viewMode === 'self'}
          onChange={handleSelfModeChange} // <- 新しいハンドラー
        />
        自分のみ表示
      </label>
      <label style={{ marginLeft: '1rem' }}>
        <input
          type="radio"
          value="team"
          checked={viewMode === 'team'}
          onChange={handleTeamModeChange} // <- 新しいハンドラー
        />
        他のメンバーを含む
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {viewMode === 'team' && (
        <div style={{ maxHeight: '100px', overflowY: 'scroll', marginTop: '0.5rem' }}>
          {/* 自分自身もメンバーリストに含める場合は filter を削除するか、調整 */}
          {/* 今回は「自分を含む」なので、自分もリストに表示し、選択可能にする */}
          {teamMembers.map((member) => ( // filter を削除
            <label key={member.id} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={selectedMembers.includes(member.id)} // <- member.id で比較
                onChange={() => toggleMember(member.id)} // <- member.id を渡す
              />
              {member.name} {member.id === currentUserId && '(自分)'} {/* 自分であることがわかるように表示 */}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}