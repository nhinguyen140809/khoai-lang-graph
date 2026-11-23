'use client'

import { type ReactNode, useState } from 'react'

import { NewProjectDialog, NewProjectPrompt } from '@/modules/project/features/create'
import { AttachedSourcesTray, AttachSourceMenu } from '@/modules/source/features/upload'
import { GlowStage } from '@/shared/components/animation'

interface ProjectStartPageProps {
  /** The projects of the user, under the prompt, for a desk that has no side list; none by default. */
  projects?: ReactNode
}

/**
 * The start page of the desk: the prompt that starts a project from an idea, in the middle of the
 * screen, with the dialog that creates it. When the desk has a side list the projects are there, so
 * the page does not list them again; when it has none, `projects` lists them quietly at the foot.
 */
export function ProjectStartPage({ projects }: ProjectStartPageProps) {
  // Kept with the page, so that the dialog does not open again when the page shows again.
  const [newProject, setNewProject] = useState({ open: false, idea: '' })

  return (
    <>
      {/* The desk scrolls the page; the stage is as tall as the page at least. */}
      <GlowStage
        backdropClassName="bottom-auto h-svh"
        className="flex min-h-full shrink-0 flex-col"
      >
        <div className="flex min-h-150 items-center px-6 py-12">
          <NewProjectPrompt
            onStart={(idea) => {
              setNewProject({ open: true, idea })
            }}
            aboveText={<AttachedSourcesTray />}
            footerEnd={<AttachSourceMenu />}
          />
        </div>
        {projects !== undefined && (
          <div className="mx-auto w-full max-w-3xl px-6 pb-10">{projects}</div>
        )}
      </GlowStage>
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
