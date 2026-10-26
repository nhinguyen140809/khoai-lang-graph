import { RegisterPage } from '@/modules/auth/features/register'
import { nextParam } from '@/shared/routes'

export default async function Page({ searchParams }: PageProps<'/register'>) {
  return <RegisterPage next={nextParam(await searchParams)} />
}
