import apiClient from './client'

export interface SignupRequest {
  email: string
  password: string
  name?: string
  school?: string
  major?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export const authApi = {
  signup: async (data: SignupRequest) => {
    const response = await apiClient.post('/auth/signup', data)
    return response.data
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    const response = await apiClient.post('/auth/verify-email', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },
}

