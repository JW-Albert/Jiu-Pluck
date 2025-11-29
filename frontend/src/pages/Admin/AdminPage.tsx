import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type User, type UserUpdate } from '../../api/users'
import { usePendingTemplates, useReviewTemplate } from '../../api/admin'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'templates'>('users')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<UserUpdate>({})

  const { data: userList, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => usersApi.getUsers(0, 100),
  })

  const { data: pendingTemplates, isLoading: templatesLoading } = usePendingTemplates()
  const reviewMutation = useReviewTemplate()
  const queryClient = useQueryClient()

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) =>
      usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setSelectedUser(null)
      setEditForm({})
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      school: user.school,
      major: user.major,
      is_active: user.is_active,
      is_admin: user.is_admin,
    })
  }

  const handleSaveUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        data: editForm,
      })
    }
  }

  const handleReviewTemplate = (templateId: number, status: 'approved' | 'rejected') => {
    if (confirm(`確定要${status === 'approved' ? '通過' : '拒絕'}這個模板嗎？`)) {
      reviewMutation.mutate({ templateId, review: { status } })
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">管理介面</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              使用者管理
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              模板審核
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">使用者列表</h2>
          </div>
          {usersLoading ? (
            <div className="p-6 text-center text-gray-500">載入中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      學校
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userList?.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                        {user.is_admin && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            管理員
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.school || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_active ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            啟用
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            停用
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('確定要刪除這個使用者嗎？')) {
                              deleteUserMutation.mutate(user.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">待審核模板</h2>
          </div>
          {templatesLoading ? (
            <div className="p-6 text-center text-gray-500">載入中...</div>
          ) : pendingTemplates && pendingTemplates.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {pendingTemplates.map((template) => (
                <div key={template.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.school} - {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        提交時間：{template.submitted_at ? new Date(template.submitted_at).toLocaleString('zh-TW') : '-'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReviewTemplate(template.id, 'approved')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        通過
                      </button>
                      <button
                        onClick={() => handleReviewTemplate(template.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        拒絕
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">節次設定：</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {template.periods.map((period, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium">{period.name}</div>
                          <div className="text-gray-600">{period.start} - {period.end}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">目前沒有待審核的模板</div>
          )}
        </div>
      )}

      {/* 編輯使用者 Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">編輯使用者</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">姓名</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">學校</label>
                  <input
                    type="text"
                    value={editForm.school || ''}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">科系</label>
                  <input
                    type="text"
                    value={editForm.major || ''}
                    onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.is_active ?? true}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">啟用</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.is_admin ?? false}
                    onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">管理員</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setEditForm({})
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

