import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type User, type UserUpdate } from '../../api/users'
import { usePendingTemplates, useReviewTemplate, useCreateTemplate, useAllTemplates, useUpdateTemplate, useDeleteTemplate, type TemplateUpdate } from '../../api/admin'
import type { TimetableTemplateCreate, PeriodTemplate, TimetableTemplateResponse } from '../../api/timetable'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'templates'>('users')
  const [templateSubTab, setTemplateSubTab] = useState<'pending' | 'all'>('pending')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<UserUpdate>({})
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplateResponse | null>(null)
  const [templateForm, setTemplateForm] = useState<TimetableTemplateCreate>({
    school: '',
    name: '',
    periods: [],
  })

  const { data: userList, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => usersApi.getUsers(0, 100),
  })

  const { data: pendingTemplates, isLoading: templatesLoading } = usePendingTemplates()
  const { data: allTemplates, isLoading: allTemplatesLoading } = useAllTemplates()
  const reviewMutation = useReviewTemplate()
  const createTemplateMutation = useCreateTemplate()
  const updateTemplateMutation = useUpdateTemplate()
  const deleteTemplateMutation = useDeleteTemplate()
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
    if (!selectedUser) return
    
    // 驗證名字欄位
    if (!editForm.name || !editForm.name.trim()) {
      alert('請輸入姓名')
      return
    }
    
    updateUserMutation.mutate({
      userId: selectedUser.id,
      data: {
        ...editForm,
        name: editForm.name.trim(),
      },
    })
  }

  const handleReviewTemplate = (templateId: number, status: 'approved' | 'rejected') => {
    if (confirm(`確定要${status === 'approved' ? '通過' : '拒絕'}這個模板嗎？`)) {
      reviewMutation.mutate({ templateId, review: { status } })
    }
  }

  const handleAddPeriod = () => {
    setTemplateForm({
      ...templateForm,
      periods: [
        ...templateForm.periods,
        { name: '', start: '', end: '' },
      ],
    })
  }

  const handleRemovePeriod = (index: number) => {
    setTemplateForm({
      ...templateForm,
      periods: templateForm.periods.filter((_, i) => i !== index),
    })
  }

  const handlePeriodChange = (index: number, field: keyof PeriodTemplate, value: string) => {
    const newPeriods = [...templateForm.periods]
    newPeriods[index] = { ...newPeriods[index], [field]: value }
    setTemplateForm({ ...templateForm, periods: newPeriods })
  }

  const handleCreateTemplate = () => {
    if (!templateForm.school || !templateForm.name || templateForm.periods.length === 0) {
      alert('請填寫所有必填欄位')
      return
    }

    if (templateForm.periods.some(p => !p.name || !p.start || !p.end)) {
      alert('請填寫所有節次的完整資訊')
      return
    }

    if (selectedTemplate) {
      // 編輯模式
      updateTemplateMutation.mutate(
        {
          templateId: selectedTemplate.id,
          data: {
            school: templateForm.school,
            name: templateForm.name,
            periods: templateForm.periods,
          },
        },
        {
          onSuccess: () => {
            setShowCreateTemplate(false)
            setSelectedTemplate(null)
            setTemplateForm({ school: '', name: '', periods: [] })
            alert('模板更新成功！')
          },
        }
      )
    } else {
      // 建立模式
      createTemplateMutation.mutate(templateForm, {
        onSuccess: () => {
          setShowCreateTemplate(false)
          setTemplateForm({ school: '', name: '', periods: [] })
          alert('模板建立成功！')
        },
      })
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
              模板管理
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
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">待審核模板</h2>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                建立新模板
              </button>
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
        </div>
      )}

      {/* 建立/編輯模板 Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedTemplate ? '編輯課表模板' : '建立課表模板'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">學校名稱 *</label>
                  <input
                    type="text"
                    value={templateForm.school}
                    onChange={(e) => setTemplateForm({ ...templateForm, school: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="例如：國立台灣大學"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">模板名稱 *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="例如：一般學期"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">節次設定 *</label>
                    <button
                      onClick={handleAddPeriod}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      新增節次
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {templateForm.periods.map((period, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <input
                          type="text"
                          value={period.name}
                          onChange={(e) => handlePeriodChange(index, 'name', e.target.value)}
                          placeholder="節次名稱（如：1）"
                          className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                        <input
                          type="time"
                          value={period.start}
                          onChange={(e) => handlePeriodChange(index, 'start', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={period.end}
                          onChange={(e) => handlePeriodChange(index, 'end', e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleRemovePeriod(index)}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                    {templateForm.periods.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        點擊「新增節次」按鈕開始新增
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateTemplate(false)
                    setSelectedTemplate(null)
                    setTemplateForm({ school: '', name: '', periods: [] })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateTemplate}
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {selectedTemplate
                    ? (updateTemplateMutation.isPending ? '更新中...' : '更新模板')
                    : (createTemplateMutation.isPending ? '建立中...' : '建立模板')}
                </button>
              </div>
            </div>
          </div>
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
                  <label className="block text-sm font-medium text-gray-700">姓名 *</label>
                  <input
                    type="text"
                    required
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

