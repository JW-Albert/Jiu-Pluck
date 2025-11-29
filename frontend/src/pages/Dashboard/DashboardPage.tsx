import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { roomsApi } from '../../api/rooms'
import { eventsApi } from '../../api/events'
import { useCurrentUser } from '../../api/users'

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getRooms,
  })

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => eventsApi.getPublicEvents({ sort: 'created_at' }),
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">儀表板</h1>
        {userLoading ? (
          <p className="text-gray-500 mt-2">載入中...</p>
        ) : user ? (
          <p className="text-lg text-gray-600 mt-2">
            歡迎，{user.name || user.email}！
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 我的房間 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">我的房間</h2>
          {roomsLoading ? (
            <p className="text-gray-500">載入中...</p>
          ) : rooms && rooms.length > 0 ? (
            <ul className="space-y-2">
              {rooms.slice(0, 5).map((room) => (
                <li key={room.id}>
                  <Link
                    to={`/rooms/${room.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {room.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">還沒有加入任何房間</p>
          )}
          <Link
            to="/rooms"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部 →
          </Link>
        </div>

        {/* 最新公開活動 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最新公開活動</h2>
          {eventsLoading ? (
            <p className="text-gray-500">載入中...</p>
          ) : events && events.length > 0 ? (
            <ul className="space-y-2">
              {events.slice(0, 5).map((event) => (
                <li key={event.id}>
                  <Link
                    to={`/events/${event.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {event.title}
                  </Link>
                  {event.start_time && (
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(event.start_time).toLocaleDateString('zh-TW')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">目前沒有公開活動</p>
          )}
          <Link
            to="/events"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部 →
          </Link>
        </div>
      </div>
    </div>
  )
}

