import { LoginPage } from '@/features/account'
import { nextParam } from '@/shared/config/routes'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  return <LoginPage next={nextParam(await searchParams)} />
}
