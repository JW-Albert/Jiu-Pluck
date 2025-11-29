import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timetableApi, type TimetableTemplate } from '../../api/timetable'
import apiClient from '../../api/client'

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const weekdayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export default function TimetablePage() {
  const [selectedWeekday, setSelectedWeekday] = useState('monday')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplate | null>(null)
  const [timetableData, setTimetableData] = useState<Record<string, Array<{ period: string; course: string }>>>({})

  const { data: templates } = useQuery({
    queryKey: ['timetable-templates'],
    queryFn: timetableApi.getTemplates,
  })

  const { data: userTimetable } = useQuery({
    queryKey: ['timetable'],
    queryFn: timetableApi.getTimetable,
  })

  // 當使用者課表載入時，更新本地狀態
  useEffect(() => {
    if (userTimetable?.data) {
      setTimetableData(userTimetable.data as Record<string, Array<{ period: string; course: string }>>)
    }
  }, [userTimetable])

  // 當選擇模板時，更新選中的模板物件
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t) => t.id.toString() === selectedTemplateId)
      setSelectedTemplate(template || null)
    } else {
      setSelectedTemplate(null)
    }
  }, [selectedTemplateId, templates])

  const { data: freeSlots } = useQuery({
    queryKey: ['free-slots', selectedWeekday, selectedTemplateId],
    queryFn: () => {
      const url = selectedTemplateId
        ? `/timetable/free-slots?weekday=${selectedWeekday}&template_id=${selectedTemplateId}`
        : `/timetable/free-slots?weekday=${selectedWeekday}`
      return apiClient.get(url).then((res) => res.data)
    },
    enabled: !!selectedWeekday,
  })

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplateId(e.target.value)
  }

  const queryClient = useQueryClient()
  const saveMutation = useMutation({
    mutationFn: timetableApi.saveTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] })
      alert('課表已儲存')
    },
  })

  const handleSave = () => {
    saveMutation.mutate(timetableData)
  }

  const handleCellClick = (weekday: string, period: string) => {
    const course = prompt('輸入課程名稱：')
    if (course) {
      setTimetableData((prev) => {
        const dayData = prev[weekday] || []
        const existing = dayData.findIndex((item) => item.period === period)
        if (existing >= 0) {
          dayData[existing].course = course
        } else {
          dayData.push({ period, course })
        }
        return { ...prev, [weekday]: dayData }
      })
    }
  }

  // 簡單的課表顯示（可以後續優化）
  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">我的課表</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">選擇學校模板</h2>
        <select
          value={selectedTemplateId}
          onChange={handleTemplateChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full"
        >
          <option value="">請選擇學校</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id.toString()}>
              {t.school} - {t.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-700">
              已選擇：<strong>{selectedTemplate.school} - {selectedTemplate.name}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              共 {selectedTemplate.periods.length} 個節次
            </p>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">課表編輯</h2>
        {selectedTemplate ? (
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day, idx) => (
              <div key={day} className="border rounded p-2">
                <div className="font-semibold text-center mb-2">{weekdayLabels[idx]}</div>
                <div className="space-y-1">
                  {selectedTemplate.periods.map((period) => {
                    const course = timetableData[day]?.find((item) => item.period === period.name)?.course
                    return (
                      <div
                        key={period.name}
                        onClick={() => handleCellClick(day, period.name)}
                        className="text-xs p-1 border rounded cursor-pointer hover:bg-gray-100"
                        title={`${period.start} - ${period.end}`}
                      >
                        <div className="font-medium">{period.name}</div>
                        <div className="text-gray-500 text-[10px]">{period.start}-{period.end}</div>
                        {course && (
                          <div className="mt-1 text-blue-600 font-semibold">{course}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            請先選擇學校模板
          </div>
        )}
        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          儲存課表
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">空堂時間</h2>
        <select
          value={selectedWeekday}
          onChange={(e) => setSelectedWeekday(e.target.value)}
          className="mb-4 border border-gray-300 rounded-md px-3 py-2"
        >
          {weekdays.map((day, idx) => (
            <option key={day} value={day}>
              {weekdayLabels[idx]}
            </option>
          ))}
        </select>
        <div className="space-y-2">
          {freeSlots?.slots.map((slot, idx) => (
            <div key={idx} className="p-2 bg-gray-50 rounded">
              {slot.start} - {slot.end}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

