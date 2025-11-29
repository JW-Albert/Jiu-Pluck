import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi, eventsApi } from '../../api/rooms'
import { PrivateEventCreate } from '../../api/events'
import { useState } from 'react'

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [eventLocation, setEventLocation] = useState('')

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
    },
  })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 實作 proposed_times 輸入
    createEventMutation.mutate({
      title: eventTitle,
      description: eventDescription,
      category: eventCategory || undefined,
      location: eventLocation || undefined,
      proposed_times: [], // TODO: 讓使用者輸入
    })
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

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{room.name}</h1>

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
                events.map((event) => (
                  <div key={event.id} className="border rounded p-4">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    {event.description && <p className="text-gray-600 mt-2">{event.description}</p>}
                    {event.vote_stats && (
                      <div className="mt-2 text-sm">
                        投票：是 {event.vote_stats.yes} / 否 {event.vote_stats.no} / 可能 {event.vote_stats.maybe}
                      </div>
                    )}
                    {/* TODO: 顯示投票按鈕 */}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">還沒有活動</p>
              )}
            </div>
          </div>
        </div>

        <div>
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
        </div>
      </div>
    </div>
  )
}

