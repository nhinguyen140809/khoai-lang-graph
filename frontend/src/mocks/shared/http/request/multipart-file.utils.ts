/** The name and the size of the file part of a request, as a browser sends it in a form. */
interface UploadedFile {
  name: string
  size: number
}

/**
 * Reads the file of a multipart request without parsing the form: its name from the part that
 * names a file, its size from the body, which is the file and a few lines of the form around it.
 * That is all the mock needs to answer an upload, and it reads the same in a browser and in a test.
 */
export async function readUploadedFile(
  request: Request,
  field: string,
): Promise<UploadedFile | null> {
  const bytes = await request.arrayBuffer()
  const text = new TextDecoder().decode(bytes)
  const match = new RegExp(`name="${field}"; filename="([^"]*)"`).exec(text)
  const name = match?.[1]
  return name === undefined ? null : { name, size: bytes.byteLength }
}
