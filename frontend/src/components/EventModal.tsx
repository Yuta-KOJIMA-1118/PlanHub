// src/components/EventModal.tsx
import { useEffect, useState } from "react"
import axios from "axios"
import './EventModal.css'

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

type Member = {
  id: number
  name: string
}

export type EventData = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  visibility: boolean;
  note: string;
  personal_note: string | null; // null の可能性も考慮
  members: number[] | null; // null の可能性も考慮
  creator: { id: number; name: string; };
}

type Props = {
  event: EventData // イベントデータは常に渡される (仮保存されたものも含む)
  onClose: () => void
  onSave: (event: EventData) => void
  onDelete: (deletedEventId: number) => void
  currentUserId: number
  currentUserTeamId: number | null
  mode: 'create' | 'edit'; // CalendarViewからモードを明示的に受け取る
}

export default function EventModal({ event, onClose, onSave, onDelete, currentUserId, currentUserTeamId, mode }: Props) {
  const isEditing = mode === 'edit'; // <- ここを修正: mode プロパティを使う
  const defaultDate = new Date().toISOString().split("T")[0]
  const defaultStart = `${defaultDate}T12:00`
  const defaultEnd = `${defaultDate}T13:00`

  // formData の初期値は props.event をそのまま使う
  // mode が 'create' の場合に、メンバーに currentUserId を含める初期化ロジックを追加
  const [formData, setFormData] = useState<EventData>(() => {
    const initialData = event;
    // 新規作成時で、members が空または null の場合、自分自身をデフォルトで参加者に含める
    if (mode === 'create' && (!initialData.members || initialData.members.length === 0) && currentUserId) {
        return { ...initialData, members: [currentUserId] };
    }
    return initialData;
  });

  const [error, setError] = useState("")
  const [teamMembers, setTeamMembers] = useState<Member[]>([])

  useEffect(() => {
    // 同チームのメンバーを取得するAPI
    console.log('Fetching team members for team ID:', currentUserTeamId)
    const fetchTeamMembers = async () => {
      if (!currentUserTeamId) {
        setTeamMembers([]);
        return;
      }
      try {
        const response = await axios.get(`${backendURL}/api/teams/${currentUserTeamId}/members`, { withCredentials: true });
        setTeamMembers(response.data);
        console.log("チームメンバー取得成功", response.data);
      } catch (err: any) {
        console.error("チームメンバーの取得に失敗しました", err.response?.data || err.message);
        setError("メンバーリストの取得に失敗しました。");
        setTeamMembers([]);
      }
    };

    fetchTeamMembers();
  }, [backendURL, currentUserTeamId]);


  const isMemberBusy = (memberId: number, start: string, end: string) => {
    return false // todo 予定被りチェックロジック (現状はダミー)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target

    if (name === "all_day") {
      const datePart = formData.start_time.split("T")[0]
      setFormData({
        ...formData,
        all_day: checked,
        start_time: checked ? datePart : `${datePart}T12:00`,
        end_time: checked ? datePart : `${datePart}T13:00`
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      })
    }
  }

  const toggleMember = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      members: (prev.members || []).includes(id)
        ? (prev.members || []).filter((m) => m !== id)
        : [...(prev.members || []), id]
    }))
  }

  const validate = () => {
    if (formData.title.trim() === "") {
      setError("タイトルは必須です")
      return false
    }
    if (!formData.all_day) {
      const [startDate] = formData.start_time.split("T")
      const [endDate] = formData.end_time.split("T")
      if (startDate !== endDate) {
        setError("開始日と終了日は同じでなければなりません（時刻はOK）")
        return false
      }
    }
    setError("")
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    // 参加者IDの配列を生成する際に、重複を排除
    // Set を利用してユニークなIDのリストを作成する
    const uniqueParticipants = Array.from(new Set([
      ...(formData.members || []),
      currentUserId // ログイン中のユーザーIDは必ず含める
    ]));

    const payload = {
      schedule: {
        title: formData.title,
        start_time: formData.start_time,
        end_time: formData.end_time,
        all_day: formData.all_day,
        visibility: formData.visibility,
        note: formData.note,
        personal_note: formData.personal_note,
        participants: uniqueParticipants // <- ここを修正
      }
    }

    try {
      // 常にPUTリクエストを送信 (仮保存されたIDを使って更新)
      const response = await axios.put(`${backendURL}/api/schedules/${formData.id}`, payload, { withCredentials: true })

      onSave(response.data.schedule as EventData)
      // onClose(); // onSaveが呼ばれるので、CalendarView側で onClose が呼ばれるようにする
    } catch (error: any) {
      console.error("保存に失敗しました", error.response?.data || error.message)
      alert("保存に失敗しました: " + (error.response?.data?.errors?.join(', ') || error.message))
      // エラー発生時はモーダルを閉じない
    }
  }

  const handleDelete = async () => {
    if (!isEditing || !formData.id) return
    if (!confirm("本当に削除しますか？")) return

    try {
      await axios.delete(`${backendURL}/api/schedules/${formData.id}`, { withCredentials: true })
      onDelete(formData.id)
      // onClose() // onDeleteが呼ばれるので、CalendarView側で onClose が呼ばれるようにする
    } catch (error: any) {
      console.error("削除に失敗しました", error.response?.data || error.message)
      alert("削除に失敗しました: " + (error.response?.data?.errors?.join(', ') || error.message))
    }
  }

  const handleModalCloseClick = () => {
    onClose(); // CalendarView の handleModalClose(false) を呼ぶ
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{mode === 'edit' ? "予定を編集" : "予定を作成"}</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="modal-form-group">
          <label>タイトル</label>
          <input name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div className="modal-form-group">
          <label>終日</label>
          <input name="all_day" type="checkbox" checked={formData.all_day} onChange={handleChange} />
        </div>

        {formData.all_day ? (
          <div className="modal-form-group">
            <label>日付</label>
            <input
              type="date"
              name="start_time"
              value={formData.start_time.split("T")[0] || ""}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <>
            <div className="modal-form-group">
              <label>開始日時</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="modal-form-group">
              <label>終了日時</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        <div className="modal-form-group">
          <label>共有メンバー（自分を除く）</label>
          <div style={{ maxHeight: '120px', overflowY: 'scroll', border: '1px solid #ccc', padding: '0.5rem' }}>
            {teamMembers.filter(m => m.id !== currentUserId).map((m) => {
              const busy = isMemberBusy(m.id, formData.start_time, formData.end_time)
              return (
                <label key={m.id} style={{ display: 'block', color: busy ? 'red' : undefined }}>
                  <input
                    type="checkbox"
                    checked={(formData.members || []).includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                  {m.name}
                </label>
              )
            })}
          </div>
        </div>

        <div className="modal-form-group">
          <label>詳細公開設定</label>
          <label>
            <input
              type="radio"
              name="visibility"
              checked={formData.visibility === true}
              onChange={() => setFormData({ ...formData, visibility: true })}
            />
            公開
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input
              type="radio"
              name="visibility"
              checked={formData.visibility === false}
              onChange={() => setFormData({ ...formData, visibility: false })}
            />
            非公開（「予定あり」のみ）
          </label>
        </div>

        <div className="modal-form-group">
          <label>共有用詳細</label>
          <textarea name="note" value={formData.note} onChange={handleChange} />
        </div>

        <div className="modal-form-group">
          <label>自分用メモ</label>
          <textarea name="personal_note" value={formData.personal_note} onChange={handleChange} />
        </div>

        <div className="modal-buttons">
          <button onClick={handleSubmit}>{mode === 'edit' ? "更新" : "作成"}</button>
          {mode === 'edit' && <button onClick={handleDelete}>削除</button>}
          <button onClick={handleModalCloseClick}>閉じる</button>
        </div>
      </div>
    </div>
  )
}