'use client'

import { type ReactNode, useState } from 'react'

import { NewProjectDialog, NewProjectPrompt } from '@/modules/project/features/create'
import { GlowStage } from '@/shared/components/animation'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

interface ProjectStartPageProps {
  /** The projects of the user, under the prompt, for a desk that has no side list; none by default. */
  projects?: ReactNode
}

/**
 * The start page of the desk: the prompt that starts a project from an idea, a little
 * above the middle of the screen, with the dialog that creates it. When the desk has a side list
 * the projects are there, so the page does not list them again; when it has none, `projects` lists
 * them under the prompt.
 */
export function ProjectStartPage({ projects }: ProjectStartPageProps) {
  // Kept with the page, so that the dialog does not open again when the page shows again.
  const [newProject, setNewProject] = useState({ open: false, idea: '' })

  return (
    <>
      <ScrollArea selfScrolling fillContent className="min-h-0 flex-1">
        <GlowStage className="flex min-h-full flex-col">
          <div className="my-auto flex flex-col gap-16 px-6 pt-8 pb-24">
            <NewProjectPrompt
              onStart={(idea) => {
                setNewProject({ open: true, idea })
              }}
            />
            {projects !== undefined && <div className="mx-auto w-full max-w-5xl">{projects}</div>}
          </div>
        </GlowStage>
      </ScrollArea>
      <NewProjectDialog
        open={newProject.open}
        idea={newProject.idea}
        onOpenChange={(open) => {
          setNewProject((previous) => ({ ...previous, open }))
        }}
      />
    </>
  )
}
