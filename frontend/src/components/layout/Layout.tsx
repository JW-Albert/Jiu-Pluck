import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../hooks/useAuthStore'
import { useCurrentUser } from '../../api/users'

export default function Layout() {
  const { clearTokens, accessToken } = useAuthStore()
  const { data: user } = useCurrentUser()
  const isAuthenticated = !!accessToken
  const navigate = useNavigate()

  const handleLogout = () => {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-2 py-2 text-xl font-bold text-blue-600">
                Jiu-Pluck
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  首頁
                </Link>
                <Link
                  to="/timetable"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  課表
                </Link>
                <Link
                  to="/rooms"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  房間
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  公開活動
                </Link>
                <Link
                  to="/settings/calendar"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-blue-600"
                >
                  設定
                </Link>
                {user?.is_admin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    管理
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  登出
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

