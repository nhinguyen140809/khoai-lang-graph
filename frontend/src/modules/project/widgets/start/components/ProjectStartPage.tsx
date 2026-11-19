'use client'

import { useState } from 'react'

import { NewProjectDialog, NewProjectPrompt } from '@/modules/project/features/create'
import { GlowStage } from '@/shared/components/animation'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

/**
 * The start page of the desk: the prompt that starts a project from an idea, a little
 * above the middle of the screen, with the dialog that creates it. The projects themselves are in
 * the side list, so the page does not list them again.
 */
export function ProjectStartPage() {
  // Kept with the page, so that the dialog does not open again when the page shows again.
  const [newProject, setNewProject] = useState({ open: false, idea: '' })

  return (
    <>
      <ScrollArea selfScrolling fillContent className="min-h-0 flex-1">
        <GlowStage className="flex min-h-full flex-col">
          <div className="my-auto px-6 pt-8 pb-24">
            <NewProjectPrompt
              onStart={(idea) => {
                setNewProject({ open: true, idea })
              }}
            />
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
