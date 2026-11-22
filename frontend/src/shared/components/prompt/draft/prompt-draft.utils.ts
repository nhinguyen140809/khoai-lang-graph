/** The drafts with the text of one prompt set; a blank text is no draft, so it leaves the drafts. */
export function draftsWith(
  drafts: Readonly<Record<string, string>>,
  name: string,
  text: string,
): Record<string, string> {
  const current = drafts[name]
  if (text.trim() === '') {
    if (current === undefined) return drafts
    return Object.fromEntries(Object.entries(drafts).filter(([other]) => other !== name))
  }
  return current === text ? drafts : { ...drafts, [name]: text }
}
