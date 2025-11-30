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

  const voteMutation = useMutation({
    mutationFn: async ({ timeIndex, vote }: { timeIndex: number; vote: 'yes' | 'no' | 'maybe' }) => {
      if (!event?.room_id) throw new Error('Room ID not found')
      return eventsApi.voteEvent(event.room_id, eventId!, { time_index: timeIndex, vote })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  const handleVote = (timeIndex: number, vote: 'yes' | 'no' | 'maybe') => {
    voteMutation.mutate({ timeIndex, vote })
  }

  if (isLoading) {
    return <div className="px-4 py-6">載入中...</div>
  }

  if (!event) {
    return <div className="px-4 py-6">活動不存在</div>
  }

  // 判斷是否已參加（公開活動）
  const isJoined = attendees?.some(a => a.user_id === currentUser?.id) || false

  // 判斷是否為私人活動（房間活動）
  const isPrivateEvent = event.public === 0 && event.room_id

  // 返回按鈕文字
  const getBackLink = () => {
    if (event.room_id) {
      return <Link to={`/rooms/${event.room_id}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">返回房間</Link>
    }
    return <Link to="/events" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">返回活動列表</Link>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {getBackLink()}

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
          {isPrivateEvent && event.proposed_times && Array.isArray(event.proposed_times) && event.proposed_times.length > 0 ? (
            <div>
              <span className="font-semibold">候選時間：</span>
              <div className="mt-2 space-y-2">
                {event.proposed_times.map((time: { start: string; end: string }, idx: number) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded">
                    {new Date(time.start).toLocaleString('zh-TW')} - {new Date(time.end).toLocaleString('zh-TW')}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* 投票功能（私人活動） */}
        {isPrivateEvent && isAuthenticated && event.proposed_times && Array.isArray(event.proposed_times) && event.proposed_times.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">投票</h3>
            <div className="space-y-4">
              {event.proposed_times.map((time: { start: string; end: string }, timeIndex: number) => {
                const timeStats = event.time_vote_stats?.find((stats: any) => stats.time_index === timeIndex)
                const userVote = event.voters?.find((v: any) => v.time_index === timeIndex && v.user_id === currentUser?.id)
                
                return (
                  <div key={timeIndex} className="border rounded p-4 bg-white">
                    <div className="mb-3">
                      <div className="font-medium text-gray-900 mb-1">
                        候選時間 {timeIndex + 1}：
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(time.start).toLocaleString('zh-TW')} - {new Date(time.end).toLocaleString('zh-TW')}
                      </div>
                    </div>
                    
                    {timeStats && (
                      <div className="mb-3 text-sm text-gray-600">
                        <div className="mb-2">
                          統計：是 {timeStats.yes} / 否 {timeStats.no} / 可能 {timeStats.maybe}
                        </div>
                        {timeStats.voters && timeStats.voters.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium mb-1">投票者：</div>
                            <div className="space-y-1">
                              {timeStats.voters.map((voter: any) => (
                                <div key={`${voter.user_id}-${timeIndex}`} className="text-xs">
                                  {voter.name || voter.user_id} - 
                                  <span className={voter.vote === 'yes' ? 'text-green-600 font-medium' : voter.vote === 'no' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>
                                    {voter.vote === 'yes' ? ' 是' : voter.vote === 'no' ? ' 否' : ' 可能'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVote(timeIndex, 'yes')}
                        disabled={voteMutation.isPending}
                        className={`px-3 py-1 text-sm rounded disabled:opacity-50 ${
                          userVote?.vote === 'yes' 
                            ? 'bg-green-700 text-white' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        是 {userVote?.vote === 'yes' && '✓'}
                      </button>
                      <button
                        onClick={() => handleVote(timeIndex, 'no')}
                        disabled={voteMutation.isPending}
                        className={`px-3 py-1 text-sm rounded disabled:opacity-50 ${
                          userVote?.vote === 'no' 
                            ? 'bg-red-700 text-white' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        否 {userVote?.vote === 'no' && '✓'}
                      </button>
                      <button
                        onClick={() => handleVote(timeIndex, 'maybe')}
                        disabled={voteMutation.isPending}
                        className={`px-3 py-1 text-sm rounded disabled:opacity-50 ${
                          userVote?.vote === 'maybe' 
                            ? 'bg-yellow-700 text-white' 
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        可能 {userVote?.vote === 'maybe' && '✓'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 報名功能（公開活動） */}
        {!isPrivateEvent && isAuthenticated && (
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

        {/* 參加者列表（公開活動） */}
        {!isPrivateEvent && (
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
        )}
      </div>
    </div>
  )
}

