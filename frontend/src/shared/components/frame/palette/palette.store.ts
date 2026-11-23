import { create } from 'zustand'

interface PaletteState {
  /** Whether the command palette is open. */
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

/** Whether the command palette is open; the commands that it lists are in the registry of `shared/lib/commands`. */
export const usePaletteStore = create<PaletteState>()((set) => ({
  open: false,
  setOpen: (open) => {
    set({ open })
  },
  toggle: () => {
    set((state) => ({ open: !state.open }))
  },
}))
