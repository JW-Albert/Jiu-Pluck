import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { roomsApi, RoomCreate } from '../../api/rooms'
import { useCurrentUser } from '../../api/users'
import { useState } from 'react'

export default function RoomListPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomSchool, setRoomSchool] = useState('')

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getRooms,
  })

  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (data: RoomCreate) => roomsApi.createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setShowCreateForm(false)
      setRoomName('')
      setRoomSchool('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => roomsApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })

  const handleDelete = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('確定要刪除這個房間嗎？')) {
      deleteMutation.mutate(roomId)
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ name: roomName, school: roomSchool || undefined })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的房間</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showCreateForm ? '取消' : '建立房間'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">建立新房間</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">房間名稱 *</label>
              <input
                type="text"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">學校</label>
              <input
                type="text"
                value={roomSchool}
                onChange={(e) => setRoomSchool(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? '建立中...' : '建立'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">通過邀請碼加入房間</h2>
        <JoinRoomForm />
      </div>

      {isLoading ? (
        <p className="text-gray-500">載入中...</p>
      ) : rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition relative"
            >
              <Link to={`/rooms/${room.id}`} className="block">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                {room.school && <p className="text-gray-600 mb-2">{room.school}</p>}
                {room.owner_name && (
                  <p className="text-sm text-gray-500">擁有者：{room.owner_name}</p>
                )}
              </Link>
              {(currentUser?.is_admin || room.owner_id === currentUser?.id) && (
                <button
                  onClick={(e) => handleDelete(e, room.id)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                  title="刪除房間"
                >
                  刪除
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">還沒有加入任何房間</p>
      )}
    </div>
  )
}

function JoinRoomForm() {
  const [inviteCode, setInviteCode] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const joinMutation = useMutation({
    mutationFn: (code: string) => roomsApi.joinRoomByCode(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setInviteCode('')
      alert(`成功加入房間：${data.room_name}`)
      navigate(`/rooms/${data.room_id}`)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || '加入失敗，請檢查邀請碼是否正確')
    },
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.trim()) {
      joinMutation.mutate(inviteCode.trim())
    }
  }

  return (
    <form onSubmit={handleJoin} className="flex items-center space-x-2">
      <input
        type="text"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
        placeholder="輸入邀請碼"
        className="flex-1 border border-gray-300 rounded-md px-3 py-2 font-mono"
        maxLength={8}
      />
      <button
        type="submit"
        disabled={joinMutation.isPending || !inviteCode.trim()}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {joinMutation.isPending ? '加入中...' : '加入房間'}
      </button>
    </form>
  )
}

