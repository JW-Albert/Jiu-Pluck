import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { eventsApi } from '../../api/events'
import { useState } from 'react'

export default function PublicEventsPage() {
  const [category, setCategory] = useState('')
  const [school, setSchool] = useState('')

  const { data: events, isLoading } = useQuery({
    queryKey: ['public-events', category, school],
    queryFn: () => eventsApi.getPublicEvents({ category: category || undefined, school: school || undefined }),
  })

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">公開活動</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="food, study, sport..."
              className="block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">學校</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">載入中...</p>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
              {event.created_by_name && (
                <p className="text-sm text-gray-500 mb-2">建立者：{event.created_by_name}</p>
              )}
              {event.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
              )}
              {event.category && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mb-2">
                  {event.category}
                </span>
              )}
              {event.start_time && (
                <p className="text-sm text-gray-500">
                  {new Date(event.start_time).toLocaleString('zh-TW')}
                </p>
              )}
              {event.location && (
                <p className="text-sm text-gray-500 mt-1">{event.location}</p>
              )}
              {event.public === 0 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded mt-2">
                  私人活動
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">目前沒有公開活動</p>
      )}
    </div>
  )
}

