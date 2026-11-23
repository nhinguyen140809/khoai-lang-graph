import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sourceKeys, uploadSource } from '@/modules/source/entities'
import { errorMessageOf } from '@/shared/api/error'

import { uploadSourceMessages } from '../upload.constants'

/**
 * Uploads files as sources of a project, one request for each file, one after the other. A toast
 * says how many went up, and one says why a file did not; the list of the sources loads again.
 */
export function useUploadSources(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: sourceKeys.upload(),
    mutationFn: async (files: readonly File[]) => {
      let uploaded = 0
      for (const file of files) {
        try {
          await uploadSource(projectId, file)
          uploaded += 1
        } catch (error) {
          toast.error(uploadSourceMessages.notUploaded(file.name), {
            description: error instanceof Error ? errorMessageOf(error) : undefined,
          })
        }
      }
      return uploaded
    },
    onSuccess: (uploaded) => {
      if (uploaded > 0) {
        toast.success(uploadSourceMessages.uploaded(uploaded), {
          description: uploadSourceMessages.uploadedHint,
        })
      }
      void queryClient.invalidateQueries({ queryKey: sourceKeys.lists() })
    },
  })
}
