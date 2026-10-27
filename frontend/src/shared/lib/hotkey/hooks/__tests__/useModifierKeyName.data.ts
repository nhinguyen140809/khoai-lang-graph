/** The user agent of a platform, and the name of its modifier key. */
export const platformCases = [
  { platform: 'a Mac', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', name: 'Cmd' },
  {
    platform: 'an iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    name: 'Cmd',
  },
  { platform: 'an iPad', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', name: 'Cmd' },
  { platform: 'Linux', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', name: 'Ctrl' },
  { platform: 'Windows', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', name: 'Ctrl' },
]
