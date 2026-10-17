import { notFound } from 'next/navigation'

// A page that fails to render, for reviewing the error boundary around it while developing;
// production builds answer 404.
export default function Page() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  throw new Error('The page failed to render.')
}
