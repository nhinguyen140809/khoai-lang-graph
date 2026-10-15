/** A key pressed with Ctrl, whether a command runs, and whether the browser's own action stops. */
export const hotkeyCases = [
  { name: 'runs a command on its hotkey', key: 'b', runs: 1, prevents: true },
  { name: 'leaves the hotkey of a command without run alone', key: 'l', runs: 0, prevents: false },
  { name: 'leaves a key of no command alone', key: 'x', runs: 0, prevents: false },
]
