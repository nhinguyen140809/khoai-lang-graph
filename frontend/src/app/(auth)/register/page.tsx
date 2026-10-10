import { RegisterPage } from '@/features/account'

export default async function Page({ searchParams }: PageProps<'/register'>) {
  const { next } = await searchParams
  return <RegisterPage next={typeof next === 'string' ? next : null} />
}
