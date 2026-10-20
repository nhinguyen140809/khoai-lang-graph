import { LoginPage } from '@/modules/auth/features/sign-in'
import { nextParam } from '@/shared/config/routes'

export default async function Page({ searchParams }: PageProps<'/login'>) {
  return <LoginPage next={nextParam(await searchParams)} />
}
