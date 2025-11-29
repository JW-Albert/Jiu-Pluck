import apiClient from './client'

export interface ProposedTime {
  start: string
  end: string
}

export interface PrivateEventCreate {
  title: string
  description?: string
  category?: string
  location?: string
  proposed_times: ProposedTime[]
}

export interface PublicEventCreate {
  title: string
  description?: string
  category?: string
  location?: string
  start_time: string
  end_time: string
}

export interface Event {
  id: string
  room_id?: string
  created_by: string
  title: string
  description?: string
  category?: string
  location?: string
  public: number
  proposed_times?: ProposedTime[]
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
  vote_stats?: { yes: number; no: number; maybe: number }
  attendees?: Array<{ user_id: string; name?: string; school?: string }>
}

export interface EventVote {
  vote: 'yes' | 'no' | 'maybe'
}

export interface EventAttendee {
  user_id: string
  name?: string
  school?: string
}

export const eventsApi = {
  // 房間活動
  createRoomEvent: async (roomId: string, data: PrivateEventCreate): Promise<Event> => {
    const response = await apiClient.post(`/rooms/${roomId}/events`, data)
    return response.data
  },

  getRoomEvents: async (roomId: string): Promise<Event[]> => {
    const response = await apiClient.get(`/rooms/${roomId}/events`)
    return response.data
  },

  voteEvent: async (roomId: string, eventId: string, vote: EventVote) => {
    const response = await apiClient.post(`/rooms/${roomId}/events/${eventId}/vote`, vote)
    return response.data
  },

  // 公開活動
  getPublicEvents: async (params?: {
    school?: string
    category?: string
    from_date?: string
    to_date?: string
    sort?: string
  }): Promise<Event[]> => {
    const response = await apiClient.get('/events/public', { params })
    return response.data
  },

  createPublicEvent: async (data: PublicEventCreate): Promise<Event> => {
    const response = await apiClient.post('/events/public', data)
    return response.data
  },

  getEvent: async (eventId: string): Promise<Event> => {
    const response = await apiClient.get(`/events/${eventId}`)
    return response.data
  },

  joinEvent: async (eventId: string) => {
    const response = await apiClient.post(`/events/${eventId}/join`)
    return response.data
  },

  leaveEvent: async (eventId: string) => {
    const response = await apiClient.post(`/events/${eventId}/leave`)
    return response.data
  },

  getEventAttendees: async (eventId: string): Promise<EventAttendee[]> => {
    const response = await apiClient.get(`/events/${eventId}/attendees`)
    return response.data
  },
}

