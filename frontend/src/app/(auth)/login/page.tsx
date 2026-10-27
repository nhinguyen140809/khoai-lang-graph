import { LoginPage } from '@/modules/auth/features/login'
import { nextParam } from '@/shared/routes'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  return <LoginPage next={nextParam(await searchParams)} />
}
