import { LoginPage } from '@/features/account'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams
  return <LoginPage next={typeof next === 'string' ? next : null} />
}
