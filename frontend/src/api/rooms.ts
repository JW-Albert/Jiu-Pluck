import apiClient from './client'

export interface Room {
  id: string
  name: string
  owner_id: string
  owner_name?: string
  school?: string
  invite_code?: string
  created_at: string
  updated_at: string
  members?: Array<{ user_id: string; name?: string; role: string }>
  events?: Array<{ id: string; title: string; created_at: string }>
}

export interface RoomCreate {
  name: string
  school?: string
}

export interface Webhook {
  id: string
  room_id: string
  url: string
  created_at: string
}

export const roomsApi = {
  getRooms: async (): Promise<Room[]> => {
    const response = await apiClient.get('/rooms')
    return response.data
  },

  getRoom: async (roomId: string): Promise<Room> => {
    const response = await apiClient.get(`/rooms/${roomId}`)
    return response.data
  },

  createRoom: async (data: RoomCreate): Promise<Room> => {
    const response = await apiClient.post('/rooms', data)
    return response.data
  },

  inviteToRoom: async (roomId: string, email: string) => {
    const response = await apiClient.post(`/rooms/${roomId}/invite`, { email })
    return response.data
  },

  getWebhooks: async (roomId: string): Promise<Webhook[]> => {
    const response = await apiClient.get(`/rooms/${roomId}/webhooks`)
    return response.data
  },

  createWebhook: async (roomId: string, url: string): Promise<Webhook> => {
    const response = await apiClient.post(`/rooms/${roomId}/webhooks`, { url })
    return response.data
  },

  deleteWebhook: async (roomId: string, webhookId: string) => {
    const response = await apiClient.delete(`/rooms/${roomId}/webhooks/${webhookId}`)
    return response.data
  },

  deleteRoom: async (roomId: string) => {
    const response = await apiClient.delete(`/rooms/${roomId}`)
    return response.data
  },

  getInviteCode: async (roomId: string) => {
    const response = await apiClient.get(`/rooms/${roomId}/invite-code`)
    return response.data
  },

  regenerateInviteCode: async (roomId: string) => {
    const response = await apiClient.post(`/rooms/${roomId}/regenerate-invite-code`)
    return response.data
  },

  joinRoomByCode: async (inviteCode: string) => {
    const response = await apiClient.post('/rooms/join', { invite_code: inviteCode })
    return response.data
  },

  getRoomMembersFreeSlots: async (roomId: string, weekday: string, templateId?: number) => {
    const params: any = { weekday }
    if (templateId) {
      params.template_id = templateId
    }
    const response = await apiClient.get(`/rooms/${roomId}/members/free-slots`, { params })
    return response.data
  },
}

