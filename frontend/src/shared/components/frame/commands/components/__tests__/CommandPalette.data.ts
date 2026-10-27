/** A search typed in the palette, the commands it shows and the ones it hides. */
export const searchCases = [
  { search: 'light', shown: ['Theme: Light'], hidden: ['Theme: Dark', 'New project'] },
  { search: 'view', shown: ['Theme: Light', 'Theme: Dark'], hidden: ['New project'] },
  { search: 'project', shown: ['New project'], hidden: ['Theme: Light', 'Theme: Dark'] },
]
