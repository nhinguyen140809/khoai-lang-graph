import { LoginPage } from '@/features/account'
import { nextParam } from '@/shared/api/auth-redirect.utils'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  return <LoginPage next={nextParam(await searchParams)} />
}
