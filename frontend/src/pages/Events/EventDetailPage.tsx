import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../../api/events'
import { useAuthStore } from '../../hooks/useAuthStore'
import { useCurrentUser } from '../../api/users'

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { accessToken } = useAuthStore()
  const { data: currentUser } = useCurrentUser()
  const navigate = useNavigate()
  const isAuthenticated = !!accessToken

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEvent(eventId!),
    enabled: !!eventId,
  })

  const { data: attendees } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: () => eventsApi.getEventAttendees(eventId!),
    enabled: !!eventId,
  })

  const queryClient = useQueryClient()
  const joinMutation = useMutation({
    mutationFn: () => eventsApi.joinEvent(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => eventsApi.leaveEvent(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      navigate('/events')
    },
  })

  const handleDelete = () => {
    if (confirm('確定要刪除這個活動嗎？')) {
      deleteMutation.mutate(eventId!)
    }
  }

  if (isLoading) {
    return <div className="px-4 py-6">載入中...</div>
  }

  if (!event) {
    return <div className="px-4 py-6">活動不存在</div>
  }

  // TODO: 從 token 取得 user_id 來判斷是否已參加
  const isJoined = false  // 暫時設為 false，需要後續實作

  return (
    <div className="px-4 py-6 sm:px-0">
      <Link to="/events" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        返回活動列表
      </Link>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            {event.created_by_name && (
              <p className="text-sm text-gray-500 mt-2">建立者：{event.created_by_name}</p>
            )}
          </div>
          {(currentUser?.is_admin || event.created_by === currentUser?.id) && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              刪除活動
            </button>
          )}
        </div>

        {event.description && (
          <p className="text-gray-700 mb-4">{event.description}</p>
        )}

        <div className="space-y-2 mb-6">
          {event.category && (
            <div>
              <span className="font-semibold">類別：</span>
              <span className="ml-2">{event.category}</span>
            </div>
          )}
          {event.location && (
            <div>
              <span className="font-semibold">地點：</span>
              <span className="ml-2">{event.location}</span>
            </div>
          )}
          {event.start_time && (
            <div>
              <span className="font-semibold">開始時間：</span>
              <span className="ml-2">{new Date(event.start_time).toLocaleString('zh-TW')}</span>
            </div>
          )}
          {event.end_time && (
            <div>
              <span className="font-semibold">結束時間：</span>
              <span className="ml-2">{new Date(event.end_time).toLocaleString('zh-TW')}</span>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="mb-6">
            {isJoined ? (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {leaveMutation.isPending ? '處理中...' : '退出活動'}
              </button>
            ) : (
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {joinMutation.isPending ? '處理中...' : '我要參加'}
              </button>
            )}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">參加者 ({attendees?.length || 0})</h2>
          {attendees && attendees.length > 0 ? (
            <ul className="space-y-2">
              {attendees.map((attendee) => (
                <li key={attendee.user_id} className="text-gray-700">
                  {attendee.name || attendee.user_id}
                  {attendee.school && <span className="text-gray-500 ml-2">({attendee.school})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">還沒有參加者</p>
          )}
        </div>
      </div>
    </div>
  )
}

