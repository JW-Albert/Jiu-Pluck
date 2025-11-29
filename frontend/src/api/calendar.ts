import apiClient from './client'

export interface CalendarStatus {
  google_connected: boolean
  apple_connected: boolean
}

export interface AppleConnectRequest {
  apple_id_email: string
  app_specific_password: string
}

export const calendarApi = {
  getGoogleAuthUrl: async (): Promise<{ auth_url: string }> => {
    const response = await apiClient.get('/calendar/google/auth')
    return response.data
  },

  getGoogleStatus: async (): Promise<CalendarStatus> => {
    const response = await apiClient.get('/calendar/google/status')
    return response.data
  },

  connectApple: async (data: AppleConnectRequest) => {
    const response = await apiClient.post('/calendar/apple/connect', data)
    return response.data
  },

  getAppleStatus: async (): Promise<CalendarStatus> => {
    const response = await apiClient.get('/calendar/apple/status')
    return response.data
  },
}

