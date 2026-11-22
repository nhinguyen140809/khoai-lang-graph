'use client'

import { PaperclipIcon } from 'lucide-react'
import { toast } from 'sonner'

import { sourceFormats } from '@/modules/source/entities'
import { MenuItem } from '@/shared/components/menu'
import { pickFiles } from '@/shared/lib/files'

import { refusalMessageOf, splitSourceFiles } from '../source-files.utils'
import { uploadSourceMessages } from '../upload.constants'

interface PickSourceItemProps {
  /** Gets the files that a source can be, chosen in the picker of the browser. */
  onPick: (files: File[]) => void
}

/** The item of a `Menu` that opens the file picker for sources; a file that cannot be a source shows why as a toast. */
export function PickSourceItem({ onPick }: PickSourceItemProps) {
  return (
    <MenuItem
      onSelect={() => {
        void pickFiles({ extensions: sourceFormats, isMultiple: true }).then((files) => {
          const { accepted, refused } = splitSourceFiles(files)
          for (const { file, problem } of refused) toast.error(refusalMessageOf(file, problem))
          if (accepted.length > 0) onPick(accepted)
        })
      }}
    >
      <PaperclipIcon aria-hidden />
      {uploadSourceMessages.item}
    </MenuItem>
  )
}
