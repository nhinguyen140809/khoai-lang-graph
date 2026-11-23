/**
 * Downloads the file at `href` under the name `fileName`, as a click on a link with `download`
 * does, without leaving the page.
 */
export function downloadFile(href: string, fileName: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
}
