import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { TimetableTemplateResponse, TimetableTemplateCreate } from './timetable'

export type TemplateReview = {
  status: 'approved' | 'rejected'
}

export type TemplateUpdate = {
  school?: string
  name?: string
  periods?: Array<{ name: string; start: string; end: string }>
}

export const adminApi = {
  getPendingTemplates: async (): Promise<TimetableTemplateResponse[]> => {
    const response = await apiClient.get('/admin/templates/pending')
    return response.data
  },

  getAllTemplates: async (status?: string): Promise<TimetableTemplateResponse[]> => {
    const params = status ? { status } : {}
    const response = await apiClient.get('/admin/templates', { params })
    return response.data
  },

  getTemplate: async (templateId: number): Promise<TimetableTemplateResponse> => {
    const response = await apiClient.get(`/admin/templates/${templateId}`)
    return response.data
  },

  createTemplate: async (data: TimetableTemplateCreate): Promise<TimetableTemplateResponse> => {
    const response = await apiClient.post('/admin/templates', data)
    return response.data
  },

  updateTemplate: async (templateId: number, data: TemplateUpdate): Promise<TimetableTemplateResponse> => {
    const response = await apiClient.put(`/admin/templates/${templateId}`, data)
    return response.data
  },

  deleteTemplate: async (templateId: number): Promise<void> => {
    await apiClient.delete(`/admin/templates/${templateId}`)
  },

  reviewTemplate: async (
    templateId: number,
    review: TemplateReview
  ): Promise<void> => {
    await apiClient.post(`/admin/templates/${templateId}/review`, review)
  },
}

export const usePendingTemplates = () => {
  return useQuery({
    queryKey: ['admin', 'pending-templates'],
    queryFn: adminApi.getPendingTemplates,
  })
}

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TimetableTemplateCreate) => adminApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-templates'] })
      queryClient.invalidateQueries({ queryKey: ['timetable-templates'] })
    },
  })
}

export const useReviewTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      review,
    }: {
      templateId: number
      review: TemplateReview
    }) => adminApi.reviewTemplate(templateId, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-templates'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      queryClient.invalidateQueries({ queryKey: ['timetable-templates'] })
    },
  })
}

export const useAllTemplates = (status?: string) => {
  return useQuery({
    queryKey: ['admin', 'templates', status],
    queryFn: () => adminApi.getAllTemplates(status),
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: TemplateUpdate }) =>
      adminApi.updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-templates'] })
      queryClient.invalidateQueries({ queryKey: ['timetable-templates'] })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (templateId: number) => adminApi.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-templates'] })
      queryClient.invalidateQueries({ queryKey: ['timetable-templates'] })
    },
  })
}

