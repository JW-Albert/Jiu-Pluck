import apiClient from './client'

export interface PeriodTemplate {
  name: string
  start: string
  end: string
}

export interface TimetableTemplate {
  id: number
  school: string
  name: string
  periods: PeriodTemplate[]
  created_by?: string
  status?: string
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  created_at?: string
  updated_at?: string
}

export interface TimetableTemplateCreate {
  school: string
  name: string
  periods: PeriodTemplate[]
}

export type TimetableTemplateResponse = TimetableTemplate

export interface TimetableData {
  monday?: Array<{ period: string; course: string }>
  tuesday?: Array<{ period: string; course: string }>
  wednesday?: Array<{ period: string; course: string }>
  thursday?: Array<{ period: string; course: string }>
  friday?: Array<{ period: string; course: string }>
  saturday?: Array<{ period: string; course: string }>
  sunday?: Array<{ period: string; course: string }>
}

export interface Timetable {
  id: number
  user_id: string
  data: TimetableData
}

export interface FreeSlot {
  start: string
  end: string
}

export const timetableApi = {
  getTemplates: async (): Promise<TimetableTemplate[]> => {
    const response = await apiClient.get('/timetable/templates')
    return response.data
  },

  getTimetable: async (): Promise<Timetable> => {
    const response = await apiClient.get('/timetable')
    return response.data
  },

  saveTimetable: async (data: TimetableData): Promise<Timetable> => {
    const response = await apiClient.post('/timetable', { data })
    return response.data
  },

  getFreeSlots: async (weekday: string): Promise<{ weekday: string; slots: FreeSlot[] }> => {
    const response = await apiClient.get(`/timetable/free-slots?weekday=${weekday}`)
    return response.data
  },

  submitTemplate: async (data: TimetableTemplateCreate): Promise<TimetableTemplate> => {
    const response = await apiClient.post('/timetable/templates/submit', data)
    return response.data
  },
}

