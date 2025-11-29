import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { TimetableTemplateResponse, TimetableTemplateCreate } from './timetable'

export type TemplateReview = {
  status: 'approved' | 'rejected'
}

export const adminApi = {
  getPendingTemplates: async (): Promise<TimetableTemplateResponse[]> => {
    const response = await apiClient.get('/admin/templates/pending')
    return response.data
  },

  createTemplate: async (data: TimetableTemplateCreate): Promise<TimetableTemplateResponse> => {
    const response = await apiClient.post('/admin/templates', data)
    return response.data
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
      queryClient.invalidateQueries({ queryKey: ['timetable-templates'] })
    },
  })
}

