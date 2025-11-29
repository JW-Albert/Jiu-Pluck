import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../hooks/useAuthStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { setTokens } = useAuthStore()

  const requestOTPMutation = useMutation({
    mutationFn: authApi.requestLoginOTP,
    onSuccess: () => {
      setOtpSent(true)
      setSuccess('登入碼已發送到您的 Email，請查收')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '發送登入碼失敗')
      setSuccess('')
    },
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      navigate('/')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || '登入失敗')
      setSuccess('')
    },
  })

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    requestOTPMutation.mutate({ email })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    loginMutation.mutate({ email, code })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登入 Jiu-Pluck
          </h2>
        </div>
        {!otpSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800">{success}</div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="請輸入您的 Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={requestOTPMutation.isPending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {requestOTPMutation.isPending ? '發送中...' : '發送登入碼'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800">{success}</div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-500 rounded-md sm:text-sm"
                  value={email}
                />
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  登入碼
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="輸入 6 位數登入碼"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loginMutation.isPending ? '登入中...' : '登入'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false)
                  setCode('')
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                重新發送登入碼
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <Link to="/signup" className="text-sm text-blue-600 hover:text-blue-500">
            還沒有帳號？立即註冊
          </Link>
        </div>
      </div>
    </div>
  )
}

