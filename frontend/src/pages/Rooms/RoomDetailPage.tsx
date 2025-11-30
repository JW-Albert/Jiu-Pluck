import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '../../api/rooms'
import { eventsApi, PrivateEventCreate, Event } from '../../api/events'
import { useCurrentUser } from '../../api/users'
import { timetableApi } from '../../api/timetable'
import { useState } from 'react'

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [proposedTimes, setProposedTimes] = useState<Array<{ start: string; end: string }>>([{ start: '', end: '' }])

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.getRoom(roomId!),
    enabled: !!roomId,
  })

  const { data: events } = useQuery({
    queryKey: ['room-events', roomId],
    queryFn: () => eventsApi.getRoomEvents(roomId!),
    enabled: !!roomId,
  })

  const [selectedWeekday, setSelectedWeekday] = useState('monday')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined)

  const { data: templates } = useQuery({
    queryKey: ['timetable-templates'],
    queryFn: timetableApi.getTemplates,
  })

  const { data: membersFreeSlots } = useQuery({
    queryKey: ['room-members-free-slots', roomId, selectedWeekday, selectedTemplateId],
    queryFn: () => roomsApi.getRoomMembersFreeSlots(roomId!, selectedWeekday, selectedTemplateId),
    enabled: !!roomId,
  })

  const { data: currentUser } = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createEventMutation = useMutation({
    mutationFn: (data: PrivateEventCreate) => eventsApi.createRoomEvent(roomId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-events', roomId] })
      setShowEventForm(false)
      // Reset form
      setEventTitle('')
      setEventDescription('')
      setEventCategory('')
      setEventLocation('')
      setProposedTimes([{ start: '', end: '' }])
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
    onSuccess: () => {
      navigate('/rooms')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-events', roomId] })
    },
  })

  const handleDeleteRoom = () => {
    if (confirm('確定要刪除這個房間嗎？這將刪除所有相關的活動。')) {
      deleteRoomMutation.mutate(roomId!)
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('確定要刪除這個活動嗎？')) {
      deleteEventMutation.mutate(eventId)
    }
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證至少有一個時間段
    const validTimes = proposedTimes.filter(t => t.start && t.end)
    if (validTimes.length === 0) {
      alert('請至少指定一個活動時間')
      return
    }
    
    // 驗證時間格式
    for (const time of validTimes) {
      const start = new Date(time.start)
      const end = new Date(time.end)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        alert('請輸入有效的時間格式')
        return
      }
      if (start >= end) {
        alert('開始時間必須早於結束時間')
        return
      }
    }
    
    createEventMutation.mutate({
      title: eventTitle,
      description: eventDescription,
      category: eventCategory || undefined,
      location: eventLocation || undefined,
      proposed_times: validTimes,
    })
  }

  const addProposedTime = () => {
    setProposedTimes([...proposedTimes, { start: '', end: '' }])
  }

  const removeProposedTime = (index: number) => {
    if (proposedTimes.length > 1) {
      setProposedTimes(proposedTimes.filter((_, i) => i !== index))
    }
  }

  const updateProposedTime = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...proposedTimes]
    updated[index] = { ...updated[index], [field]: value }
    setProposedTimes(updated)
  }

  if (isLoading) {
    return <div className="px-4 py-6">載入中...</div>
  }

  if (!room) {
    return <div className="px-4 py-6">房間不存在</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Link to="/rooms" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        返回房間列表
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
        {(currentUser?.is_admin || room.owner_id === currentUser?.id) && (
          <button
            onClick={handleDeleteRoom}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            刪除房間
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">活動列表</h2>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {showEventForm ? '取消' : '新增活動'}
              </button>
            </div>

            {showEventForm && (
              <form onSubmit={handleCreateEvent} className="mb-6 space-y-4 p-4 bg-gray-50 rounded">
                <div>
                  <label className="block text-sm font-medium text-gray-700">活動標題 *</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">描述</label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">類別</label>
                  <input
                    type="text"
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="food, study, sport..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">地點</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    候選時間 *（至少需要一個）
                  </label>
                  {proposedTimes.map((time, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="datetime-local"
                        required
                        value={time.start}
                        onChange={(e) => updateProposedTime(index, 'start', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="開始時間"
                      />
                      <input
                        type="datetime-local"
                        required
                        value={time.end}
                        onChange={(e) => updateProposedTime(index, 'end', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="結束時間"
                      />
                      {proposedTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProposedTime(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addProposedTime}
                    className="mt-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    + 新增時間選項
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createEventMutation.isPending ? '建立中...' : '建立活動'}
                </button>
              </form>
            )}

            <div className="space-y-4">
              {events && events.length > 0 ? (
                events.map((event: Event) => (
                  <div key={event.id} className="border rounded p-4 relative hover:shadow-md transition">
                    <Link to={`/events/${event.id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">{event.title}</h3>
                          {event.created_by_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              建立者：{event.created_by_name}
                            </p>
                          )}
                          {event.description && <p className="text-gray-600 mt-2 line-clamp-2">{event.description}</p>}
                          {event.vote_stats && (
                            <div className="mt-2 text-sm text-gray-600">
                              投票：是 {event.vote_stats.yes} / 否 {event.vote_stats.no} / 可能 {event.vote_stats.maybe}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="mt-2 flex justify-between items-center">
                      <Link
                        to={`/events/${event.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看詳情 →
                      </Link>
                      {(currentUser?.is_admin || event.created_by === currentUser?.id || room.owner_id === currentUser?.id) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteEvent(event.id)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="刪除活動"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">還沒有活動</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">成員</h2>
            <ul className="space-y-2">
              {room.members?.map((member) => (
                <li key={member.user_id} className="text-gray-700">
                  {member.name || member.user_id} ({member.role})
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">成員空閒時間</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇星期</label>
                <select
                  value={selectedWeekday}
                  onChange={(e) => setSelectedWeekday(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="monday">週一</option>
                  <option value="tuesday">週二</option>
                  <option value="wednesday">週三</option>
                  <option value="thursday">週四</option>
                  <option value="friday">週五</option>
                  <option value="saturday">週六</option>
                  <option value="sunday">週日</option>
                </select>
              </div>
              {templates && templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">選擇時間模板（可選）</label>
                  <select
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">使用預設時間</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.school} - {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {membersFreeSlots && membersFreeSlots.members && membersFreeSlots.members.length > 0 ? (
                <div className="space-y-4">
                  {membersFreeSlots.members.map((member) => (
                    <div key={member.user_id} className="border rounded p-3">
                      <h3 className="font-semibold mb-2">{member.name || member.user_id}</h3>
                      {member.slots && member.slots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {member.slots.map((slot: { start: string; end: string }, idx: number) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                              {slot.start} - {slot.end}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">該時段無空閒時間</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">載入中...</p>
              )}
            </div>
          </div>

          {(currentUser?.is_admin || room.owner_id === currentUser?.id) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">邀請設定</h2>
              {room.invite_code ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">邀請碼：</p>
                  <div className="flex items-center space-x-2 mb-4">
                    <code className="px-3 py-2 bg-gray-100 rounded text-lg font-mono">
                      {room.invite_code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(room.invite_code!)
                        alert('邀請碼已複製到剪貼簿')
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      複製
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('確定要重新生成邀請碼嗎？舊的邀請碼將失效。')) {
                        try {
                          await roomsApi.regenerateInviteCode(roomId!)
                          queryClient.invalidateQueries({ queryKey: ['room', roomId] })
                          alert('邀請碼已重新生成')
                        } catch (error) {
                          alert('重新生成失敗')
                        }
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    重新生成邀請碼
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">載入中...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

