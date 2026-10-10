import { create } from 'zustand'

interface CommandPaletteState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

/** Whether the command palette is open; the search box of the top bar and Ctrl+K open it. */
export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  open: false,
  setOpen: (open) => {
    set({ open })
  },
  toggle: () => {
    set((state) => ({ open: !state.open }))
  },
}))
