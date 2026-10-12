'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ErrorState, LoadingState } from '@/components/state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useCatalog, useDefinition, useModelChoices } from '../hooks/useAccountQueries'
import { useProfile } from '../hooks/useProfile'
import { useUserSettings } from '../hooks/useUserSettings'
import { settingsSectionOf, userSettingsHref } from '../section.utils'
import { settingsSectionLabels, settingsSections } from '../settings.types'
import { ModelChoicesForm } from './ModelChoicesForm'
import { PasswordForm } from './PasswordForm'
import { PreferencesForm } from './PreferencesForm'
import { ProfileForm } from './ProfileForm'
import { SessionsList } from './SessionsList'
import { UsageView } from './UsageView'

function ModelsSection() {
  const definition = useDefinition()
  const catalog = useCatalog()
  const choices = useModelChoices()
  const failed = [definition, catalog, choices].find((query) => query.isError)
  if (failed?.error) {
    return <ErrorState message={failed.error.message} onRetry={() => void failed.refetch()} />
  }
  if (definition.data === undefined || catalog.data === undefined || choices.data === undefined) {
    return <LoadingState label="Loading your models" rows={4} />
  }
  return (
    <ModelChoicesForm definition={definition.data} catalog={catalog.data} choices={choices.data} />
  )
}

function PreferencesSection() {
  const settings = useUserSettings()
  const definition = useDefinition()
  if (settings.isError) {
    return <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} />
  }
  if (definition.isError) {
    return (
      <ErrorState message={definition.error.message} onRetry={() => void definition.refetch()} />
    )
  }
  if (settings.data === undefined || definition.data === undefined) {
    return <LoadingState label="Loading your preferences" rows={4} />
  }
  return <PreferencesForm settings={settings.data} definition={definition.data} />
}

function ProfileSection() {
  const profile = useProfile()
  if (profile.isError) {
    return <ErrorState message={profile.error.message} onRetry={() => void profile.refetch()} />
  }
  if (profile.data === undefined) return <LoadingState label="Loading your profile" rows={3} />
  return <ProfileForm profile={profile.data} />
}

/** The settings of the user, outside a project: one section at a time, chosen in the address. */
export function UserSettingsPage() {
  const section = settingsSectionOf(useSearchParams().get('section'))

  return (
    <div className="flex h-full min-h-0">
      <nav aria-label="Sections" className="flex w-44 shrink-0 flex-col gap-px border-r p-2">
        {settingsSections.map((entry) => (
          <Link
            key={entry}
            href={userSettingsHref(entry) as Route}
            aria-current={entry === section ? 'page' : undefined}
            className={cn(
              'rounded-md px-2 py-1 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
              entry === section && 'bg-accent font-medium',
            )}
          >
            {settingsSectionLabels[entry]}
          </Link>
        ))}
      </nav>
      <ScrollArea className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 p-6">
          <h1 className="text-sm font-medium">{settingsSectionLabels[section]}</h1>
          {section === 'profile' && <ProfileSection />}
          {section === 'password' && <PasswordForm />}
          {section === 'preferences' && <PreferencesSection />}
          {section === 'models' && <ModelsSection />}
          {section === 'usage' && <UsageView />}
          {section === 'sessions' && <SessionsList />}
        </div>
      </ScrollArea>
    </div>
  )
}
