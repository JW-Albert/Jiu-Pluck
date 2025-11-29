import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timetableApi } from '../../api/timetable'

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const weekdayLabels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export default function TimetablePage() {
  const [selectedWeekday, setSelectedWeekday] = useState('monday')
  const [timetableData, setTimetableData] = useState<Record<string, Array<{ period: string; course: string }>>>({})

  const { data: templates } = useQuery({
    queryKey: ['timetable-templates'],
    queryFn: timetableApi.getTemplates,
  })

  const { data: timetable } = useQuery({
    queryKey: ['timetable'],
    queryFn: timetableApi.getTimetable,
  })

  const { data: freeSlots } = useQuery({
    queryKey: ['free-slots', selectedWeekday],
    queryFn: () => timetableApi.getFreeSlots(selectedWeekday),
    enabled: !!selectedWeekday,
  })

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
        <select className="border border-gray-300 rounded-md px-3 py-2">
          <option>請選擇學校</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.school} - {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">課表編輯</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((day, idx) => (
            <div key={day} className="border rounded p-2">
              <div className="font-semibold text-center mb-2">{weekdayLabels[idx]}</div>
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                  const course = timetableData[day]?.find((item) => item.period === String(period))?.course
                  return (
                    <div
                      key={period}
                      onClick={() => handleCellClick(day, String(period))}
                      className="text-xs p-1 border rounded cursor-pointer hover:bg-gray-100"
                    >
                      {course || `${period} 節`}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
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

