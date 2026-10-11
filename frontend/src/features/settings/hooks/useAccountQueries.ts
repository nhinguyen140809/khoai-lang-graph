import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changePassword,
  changeProfile,
  getCurrentDefinition,
  getUsage,
  listCatalog,
  listModelChoices,
  listSessions,
  replaceModelChoices,
  replaceUserSettings,
  revokeSession,
  type UserSettingsBody,
} from '../settings.api'
import type { UsageGroup } from '../settings.types'
import { userSettingsQueryKey } from './useUserSettings'

export function useSessions() {
  return useQuery({ queryKey: ['settings', 'sessions'], queryFn: listSessions })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'sessions'] }),
  })
}

export function useModelChoices() {
  return useQuery({ queryKey: ['settings', 'model-choices'], queryFn: listModelChoices })
}

export function useSaveModelChoices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: replaceModelChoices,
    onSuccess: (items) => {
      queryClient.setQueryData(['settings', 'model-choices'], items)
    },
  })
}

export function useCatalog() {
  return useQuery({
    queryKey: ['settings', 'catalog'],
    queryFn: listCatalog,
    staleTime: 5 * 60_000,
  })
}

export function useDefinition() {
  return useQuery({
    queryKey: ['settings', 'definition'],
    queryFn: getCurrentDefinition,
    staleTime: 5 * 60_000,
  })
}

export function useUsage(groupBy: UsageGroup) {
  return useQuery({ queryKey: ['settings', 'usage', groupBy], queryFn: () => getUsage(groupBy) })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}

export function useChangeProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: changeProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account'] }),
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserSettingsBody) => replaceUserSettings(body),
    onSuccess: (settings) => {
      queryClient.setQueryData(userSettingsQueryKey, settings)
    },
  })
}
