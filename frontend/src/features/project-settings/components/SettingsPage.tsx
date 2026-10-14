'use client'

import { useSearchParams } from 'next/navigation'

import { isNotFoundError } from '@/shared/api/api-error.utils'
import { projectTabGroup, useEditorTab } from '@/shared/components/frame'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { RouteParam, settingsHref } from '@/shared/config/routes.utils'

import { useModels } from '../hooks/useModels'
import { useSettingsDefinition } from '../hooks/useSettingsDefinition'
import { useSettingsProject } from '../hooks/useSettingsProject'
import { sectionLabels } from '../project-settings.types'
import { ProjectSettingsTabIcon } from '../project-settings-frame.config'
import { sectionOf } from '../section.utils'
import { GeneralForm } from './GeneralForm'
import { ModelsForm } from './ModelsForm'
import { RunsForm } from './RunsForm'

/** One section of the settings of a project, chosen in the address. */
export function SettingsPage({ projectId }: { projectId: string }) {
  const section = sectionOf(useSearchParams().get(RouteParam.Section))
  const project = useSettingsProject(projectId)
  const definition = useSettingsDefinition()
  const models = useModels()

  useEditorTab(projectTabGroup(projectId), {
    id: 'settings',
    title: 'Settings',
    href: settingsHref(projectId, section),
    icon: ProjectSettingsTabIcon.Settings,
  })

  if (project.isPending) return <LoadingState label="Loading the settings" rows={5} />
  if (project.isError) {
    return isNotFoundError(project.error) ? (
      <NotFoundState
        title="Project not found"
        description="No project has this address."
        reference={projectId}
      />
    ) : (
      <ErrorState message={project.error.message} onRetry={() => void project.refetch()} />
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-sm font-medium">{sectionLabels[section]}</h1>
        {section === 'general' && <GeneralForm key={project.data.id} project={project.data} />}
        {section !== 'general' && definition.isPending && (
          <LoadingState label="Loading the workflow" rows={4} />
        )}
        {section !== 'general' && definition.isError && (
          <ErrorState
            message={definition.error.message}
            onRetry={() => void definition.refetch()}
          />
        )}
        {section === 'runs' && definition.data !== undefined && (
          <RunsForm key={project.data.id} project={project.data} definition={definition.data} />
        )}
        {section === 'models' && definition.data !== undefined && models.isError && (
          <ErrorState message={models.error.message} onRetry={() => void models.refetch()} />
        )}
        {section === 'models' && definition.data !== undefined && models.data !== undefined && (
          <ModelsForm
            key={project.data.id}
            project={project.data}
            definition={definition.data}
            models={models.data}
          />
        )}
        {section === 'models' && definition.data !== undefined && models.isPending && (
          <LoadingState label="Loading the models" rows={4} />
        )}
      </div>
    </ScrollArea>
  )
}
