import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarApi, AppleConnectRequest } from '../../api/calendar'
import { useState } from 'react'

export default function CalendarSettingsPage() {
  const [appleEmail, setAppleEmail] = useState('')
  const [applePassword, setApplePassword] = useState('')
  const [showAppleForm, setShowAppleForm] = useState(false)

  const { data: googleStatus } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: calendarApi.getGoogleStatus,
  })

  const { data: appleStatus } = useQuery({
    queryKey: ['apple-calendar-status'],
    queryFn: calendarApi.getAppleStatus,
  })

  const queryClient = useQueryClient()
  const connectAppleMutation = useMutation({
    mutationFn: (data: AppleConnectRequest) => calendarApi.connectApple(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apple-calendar-status'] })
      setShowAppleForm(false)
      setAppleEmail('')
      setApplePassword('')
      alert('Apple Calendar 連線成功')
    },
    onError: (err: any) => {
      alert('連線失敗：' + (err.response?.data?.detail || '未知錯誤'))
    },
  })

  const handleGoogleAuth = async () => {
    try {
      const { auth_url } = await calendarApi.getGoogleAuthUrl()
      window.location.href = auth_url
    } catch (err: any) {
      alert('取得授權 URL 失敗：' + (err.response?.data?.detail || '未知錯誤'))
    }
  }

  const handleAppleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    connectAppleMutation.mutate({
      apple_id_email: appleEmail,
      app_specific_password: applePassword,
    })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">行事曆設定</h1>

      <div className="space-y-6">
        {/* Google Calendar */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Google Calendar</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                狀態：{googleStatus?.google_connected ? '已連線' : '未連線'}
              </p>
            </div>
            {!googleStatus?.google_connected ? (
              <button
                onClick={handleGoogleAuth}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                連線 Google Calendar
              </button>
            ) : (
              <span className="text-green-600">已連線</span>
            )}
          </div>
        </div>

        {/* Apple Calendar */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Apple Calendar (iCloud)</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600">
                狀態：{appleStatus?.apple_connected ? '已連線' : '未連線'}
              </p>
            </div>
            {!appleStatus?.apple_connected && !showAppleForm && (
              <button
                onClick={() => setShowAppleForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                連線 Apple Calendar
              </button>
            )}
            {appleStatus?.apple_connected && (
              <span className="text-green-600">已連線</span>
            )}
          </div>

          {showAppleForm && (
            <form onSubmit={handleAppleConnect} className="space-y-4 p-4 bg-gray-50 rounded">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apple ID Email
                </label>
                <input
                  type="email"
                  required
                  value={appleEmail}
                  onChange={(e) => setAppleEmail(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="your@icloud.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App-specific Password
                </label>
                <input
                  type="password"
                  required
                  value={applePassword}
                  onChange={(e) => setApplePassword(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  請到 appleid.apple.com 產生 App-specific Password
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={connectAppleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {connectAppleMutation.isPending ? '連線中...' : '連線'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAppleForm(false)
                    setAppleEmail('')
                    setApplePassword('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

