/** A key and the modifier held with it, such as Ctrl+B. */
export interface Hotkey {
  /** A character, such as `k` or `?`, or a key name, such as `Escape`. */
  key: string
  /**
   * Requires the modifier key of the platform: Ctrl on Windows and Linux, Cmd on macOS. Without
   * it, the key matches only when neither is held.
   */
  mod?: boolean
  /**
   * Requires Ctrl on every platform instead, for a key whose Cmd shortcut macOS keeps for itself,
   * such as Cmd+` that switches windows.
   */
  ctrl?: boolean
}
