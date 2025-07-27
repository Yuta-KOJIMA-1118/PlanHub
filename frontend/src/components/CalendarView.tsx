// src/components/CalendarView.tsx
import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import EventModal from './EventModal'
import ViewModeSelector from './ViewModeSelector'
import { formatDateToLocalString } from '../utils/time'
import axios from 'axios'

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export type EventData = {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  members: number[] | null;
  visibility: boolean;
  note: string;
  personal_note: string | null;
  creator: { id: number; name: string; } | null;
}

interface CalendarViewProps {
  currentUserId: number;
  currentUserTeamId: number | null;
}

export default function CalendarView({ currentUserId, currentUserTeamId }: CalendarViewProps) {
  // editingEvent の型定義を修正: 予定データとそのモードを明確に分ける
  const [editingEvent, setEditingEvent] = useState<{
    data: EventData; // 予定データ
    mode: 'create' | 'edit'; // モーダルのモード
  } | null>(null); // <- ここを修正

  const [events, setEvents] = useState<EventData[]>([])
  const [viewMode, setViewMode] = useState<'self' | 'team'>('self')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])

  console.log("CalendarView props:", { currentUserId, currentUserTeamId });

  // スケジュール取得のuseEffect
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUserTeamId) {
        setEvents([]);
        console.warn("チームに所属していないため、スケジュールを取得できません。");
        return;
      }

      try {
        console.log(`Fetching schedules for team ${currentUserTeamId}...`);
        const res = await axios.get(
          `${backendURL}/api/schedules`,
          { withCredentials: true }
        );
        setEvents(res.data.map((event: any) => ({
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          all_day: event.all_day,
          members: event.members || [],
          visibility: event.visibility,
          note: event.note,
          personal_note: event.personal_note,
          creator: event.creator || null
        })));
        console.log('スケジュールの取得に成功しました', res.data);
      } catch (err: any) {
        console.error('スケジュールの取得に失敗しました', err.response?.data || err.message);
        setEvents([]);
      }
    }
    fetchEvents()
  }, [currentUserTeamId]);

  // ViewMode と selectedMembers に基づいて表示するイベントをフィルタリング
  const filteredEvents = events.filter(event => {
    if (viewMode === 'self') {
      return (event.members || []).includes(currentUserId) || (event.creator && event.creator.id === currentUserId);
    } else {
      if (selectedMembers.length === 0) {
        return false;
      }
      return selectedMembers.some(selectedId => (event.members || []).includes(selectedId));
    }
  });


  const handleDateClick = async (info: any) => {
    console.log('Date clicked:', info.dateStr)
    const viewType = info.view.type
    const date = info.date
    let startStr: string;
    let endStr: string;
    let allDay: boolean;

    if (viewType === "timeGridWeek" || viewType === "timeGridDay") {
      allDay = false
      const startHour = date.getHours()
      const endHour = Math.min(startHour + 1, 23)
      const pad = (n: number) => n.toString().padStart(2, "0")
      const y = date.getFullYear()
      const m = pad(date.getMonth() + 1)
      const d = pad(date.getDate())
      const h = pad(startHour)
      const h2 = pad(endHour)
      startStr = `${y}-${m}-${d}T${h}:00`
      endStr = `${y}-${m}-${d}T${h2}:00`
    } else {
      allDay = true;
      const ymd = info.dateStr
      startStr = ymd
      endStr = ymd
    }

    // まず、バックエンドに空の（またはデフォルト値の）予定を仮保存し、IDを取得する
    const initialPayload = {
      schedule: {
        title: "", // 空のタイトルで仮保存
        start_time: startStr,
        end_time: endStr,
        all_day: allDay,
        participants: [currentUserId], // 作成者自身をデフォルトで参加者に含める
        visibility: false,
        note: "",
        personal_note: ""
      }
    };

    try {
      const response = await axios.post(`${backendURL}/api/schedules`, initialPayload, { withCredentials: true });
      const createdSchedule: EventData = {
        ...response.data.schedule,
        // creator: response.data.schedule.creator はAPIレスポンスに含まれているはず
      };
      
      // IDを持つ予定データとモードをセット
      setEditingEvent({ data: createdSchedule, mode: 'create' }); // <- ここを修正: mode を 'create' に明示
      console.log('Draft event created:', createdSchedule);
    } catch (error: any) {
      console.error("仮予定の作成に失敗しました", error.response?.data || error.message);
      alert("予定作成の準備に失敗しました: " + (error.response?.data?.errors?.join(', ') || error.message));
    }
  }


  const handleEventClick = (info: any) => {
    console.log('Event clicked:', info.event)
    const clickedEvent = info.event
    const data: EventData = {
      id: Number(clickedEvent.id),
      title: clickedEvent.title,
      start_time: formatDateToLocalString(new Date(clickedEvent.start)),
      end_time: formatDateToLocalString(new Date(clickedEvent.end)),
      all_day: clickedEvent.allDay,
      members: clickedEvent.extendedProps.members || [],
      visibility: clickedEvent.extendedProps.visibility,
      note: clickedEvent.extendedProps.note || '',
      personal_note: clickedEvent.extendedProps.personal_note || null,
      creator: clickedEvent.extendedProps.creator || null
    }

    // 既存のイベントなのでモードは 'edit'
    setEditingEvent({ data: data, mode: 'edit' }) // <- ここを修正: mode を 'edit' に明示
  }

  // モーダルが閉じられたときの処理（キャンセルまたは保存完了）
  const handleModalClose = async (saved: boolean) => {
    // editingEvent が存在し、かつ保存されなかった場合（キャンセル時）
    // さらに、モードが 'create' であることを確認
    if (editingEvent && !saved && editingEvent.mode === 'create') { // <- ここを修正
      const isNewEventCanceledAndOwned = editingEvent.data.creator.id === currentUserId; // 自分が作成者であることのみ確認 (仮作成イベントは自分しか削除しない想定)

      if (isNewEventCanceledAndOwned) {
        try {
          await axios.delete(`${backendURL}/api/schedules/${editingEvent.data.id}`, { withCredentials: true });
          console.log(`仮予定 (ID: ${editingEvent.data.id}) が削除されました。`);
          setEvents(prev => prev.filter(ev => ev.id !== editingEvent.data.id));
        } catch (error) {
          console.error(`仮予定 (ID: ${editingEvent.data.id}) の削除に失敗しました`, error);
        }
      }
    }
    setEditingEvent(null);
    // スケジュール一覧を再取得して最新の状態にする (保存・削除時も含む)
    const fetchEvents = async () => {
      if (!currentUserTeamId) {
        setEvents([]);
        return;
      }
      try {
        const res = await axios.get(`${backendURL}/api/schedules`, { withCredentials: true });
        setEvents(res.data.map((event: any) => ({
          id: event.id, title: event.title, start_time: event.start_time, end_time: event.end_time,
          all_day: event.all_day, members: event.members || [], visibility: event.visibility, note: event.note,
          personal_note: event.personal_note, creator: event.creator
        })));
      } catch (err: any) {
        console.error('スケジュールの再取得に失敗しました', err.response?.data || err.message);
        setEvents([]);
      }
    };
    fetchEvents();
  };


  const handleSaveEvent = (savedEvent: EventData) => {
    setEvents((prev) => {
      const updatedEvents = prev.map(ev => ev.id === savedEvent.id ? savedEvent : ev);
      if (!updatedEvents.some(ev => ev.id === savedEvent.id)) {
        return [...updatedEvents, savedEvent];
      }
      return updatedEvents;
    });
    handleModalClose(true); // 保存が完了したのでtrueを渡して閉じる
  };

  const handleDeleteEvent = (deletedEventId: number) => {
    setEvents(prev => prev.filter(ev => ev.id !== deletedEventId));
    handleModalClose(true); // 削除が完了したのでtrueを渡して閉じる
  };

  return (
    <div className="p-4">
      <ViewModeSelector
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        currentUserId={currentUserId}
        currentUserTeamId={currentUserTeamId}
      />

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={filteredEvents.map((e) => {
          if (e.id === undefined || e.id === null) {
            console.warn("FullCalendar イベントにIDがない要素が見つかりました（レンダリングスキップ）:", e);
            return null;
          }
          return {
            id: e.id.toString(),
            title: e.title,
            start: e.start_time,
            end: e.end_time,
            allDay: e.all_day,
            extendedProps: {
              members: e.members || [],
              visibility: e.visibility,
              note: e.note,
              personal_note: e.personal_note,
              creator: e.creator || null
            }
          }
        }).filter(Boolean)}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      {editingEvent && (
        <EventModal
          event={editingEvent.data} // <- ここを修正
          mode={editingEvent.mode} // <- ここを修正
          onClose={() => handleModalClose(false)}
          onSave={(savedEvent) => handleSaveEvent(savedEvent)}
          onDelete={() => handleDeleteEvent(editingEvent.data.id)} // <- ここを修正
          currentUserId={currentUserId}
          currentUserTeamId={currentUserTeamId}
        />
      )}
    </div>
  )
}