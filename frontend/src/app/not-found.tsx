import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <p>Page not found.</p>
      <Link href="/" className="text-sm underline">
        Back to the app
      </Link>
    </div>
  )
}
