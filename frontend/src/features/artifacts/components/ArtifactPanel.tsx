'use client'

import { useState } from 'react'

import { cn } from '@/shared/lib/utils'

import { ArtifactDocument } from './ArtifactDocument'
import { ItemOpenContext } from './ItemOpenContext'
import { ItemPage } from './ItemPage'

interface ArtifactPanelProps {
  projectId: string
  /** The artifacts to read, each a tab. */
  artifacts: { id: string; title: string; version: number }[]
}

/**
 * Artifacts to read inside another view, one tab for each. A click on an item opens the item in
 * the panel, with a button back to the artifact; the items marked `M` are the ones the user changed.
 */
export function ArtifactPanel({ projectId, artifacts }: ArtifactPanelProps) {
  const [activeId, setActiveId] = useState(artifacts[0]?.id)
  const [itemId, setItemId] = useState<string | null>(null)

  return (
    <ItemOpenContext.Provider value={setItemId}>
      <div className="flex h-full min-h-0 flex-col">
        <div role="tablist" aria-label="Artifacts under review" className="flex shrink-0 border-b">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              type="button"
              role="tab"
              aria-selected={artifact.id === activeId}
              onClick={() => {
                setActiveId(artifact.id)
                setItemId(null)
              }}
              className={cn(
                'border-b-2 px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                artifact.id === activeId
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {artifact.title} v{artifact.version}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="min-h-0 flex-1 overflow-auto">
          {activeId === undefined ? null : itemId === null ? (
            <ArtifactDocument
              projectId={projectId}
              artifactId={activeId}
              embedded
              markEdited
              onOpenItem={setItemId}
            />
          ) : (
            <ItemPage
              projectId={projectId}
              itemId={itemId}
              embedded
              onBack={() => {
                setItemId(null)
              }}
            />
          )}
        </div>
      </div>
    </ItemOpenContext.Provider>
  )
}
