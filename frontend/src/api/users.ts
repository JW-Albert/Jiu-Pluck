import { useQuery } from '@tanstack/react-query'
import apiClient from './client'

export type User = {
  id: string
  email: string
  name?: string
  school?: string
  major?: string
  email_verified: boolean
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserUpdate = {
  name?: string
  school?: string
  major?: string
  is_active?: boolean
  is_admin?: boolean
}

export type UserListResponse = {
  users: User[]
  total: number
}

export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  getUsers: async (skip = 0, limit = 50): Promise<UserListResponse> => {
    const response = await apiClient.get('/admin/users', {
      params: { skip, limit },
    })
    return response.data
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${userId}`)
    return response.data
  },

  updateUser: async (userId: string, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`)
  },
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: usersApi.getCurrentUser,
  })
}

