import { toast } from 'sonner'
import { vi } from 'vitest'

/** Watches one kind of toast in the running test; the spy is restored when the test ends. */
export function spyOnToast(kind: 'success' | 'error' | 'info') {
  return vi.spyOn(toast, kind)
}
