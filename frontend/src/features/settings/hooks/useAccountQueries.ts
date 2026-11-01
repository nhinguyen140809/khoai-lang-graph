import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseFormSetError } from 'react-hook-form'
import type { z } from 'zod'

import { type FieldOf, formErrorOf, showFieldProblems } from '@/shared/components/form'

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
import {
  type ModelChoicesForm,
  modelChoicesFormSchema,
  type PasswordForm,
  passwordFormSchema,
  type PreferencesForm,
  type ProfileForm,
  profileFormSchema,
} from '../settings.schema'
import type { ModelChoice, UsageGroup } from '../settings.types'
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

// The API names a problem of a choice by its place in the list sent, the form by its role.
function choiceFieldOf(items: ModelChoice[] | undefined): FieldOf {
  return (field) =>
    field.replace(/^items\.(\d+)/, (path, index: string) => {
      const role = items?.[Number(index)]?.agent_role
      return role === undefined ? path : `choices.${role}`
    })
}

/** Saves the model choices; the problems of the API show at the fields of the form. */
export function useSaveModelChoices(setError: UseFormSetError<ModelChoicesForm>) {
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: replaceModelChoices,
    onSuccess: (items) => {
      queryClient.setQueryData(['settings', 'model-choices'], items)
    },
    onError: (error, items) => {
      showFieldProblems(setError, error, modelChoicesFormSchema, choiceFieldOf(items))
    },
  })
  return {
    ...save,
    formError: formErrorOf(save.error, modelChoicesFormSchema, choiceFieldOf(save.variables)),
  }
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

/** Changes the password; the problems of the API show at the fields of the form. */
export function useChangePassword(setError: UseFormSetError<PasswordForm>) {
  const change = useMutation({
    mutationFn: changePassword,
    onError: (error) => {
      showFieldProblems(setError, error, passwordFormSchema)
    },
  })
  return { ...change, formError: formErrorOf(change.error, passwordFormSchema) }
}

/** Saves the profile, then reads the account again; the problems of the API show at the fields. */
export function useChangeProfile(setError: UseFormSetError<ProfileForm>) {
  const queryClient = useQueryClient()
  const change = useMutation({
    mutationFn: changeProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account'] }),
    onError: (error) => {
      showFieldProblems(setError, error, profileFormSchema)
    },
  })
  return { ...change, formError: formErrorOf(change.error, profileFormSchema) }
}

/**
 * Saves the preferences; the problems of the API show at the fields of the form, whose schema
 * depends on the run parameters of the workflow.
 */
export function useSavePreferences(setError: UseFormSetError<PreferencesForm>, schema: z.ZodType) {
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: (body: UserSettingsBody) => replaceUserSettings(body),
    onSuccess: (settings) => {
      queryClient.setQueryData(userSettingsQueryKey, settings)
    },
    onError: (error) => {
      showFieldProblems(setError, error, schema)
    },
  })
  return { ...save, formError: formErrorOf(save.error, schema) }
}
