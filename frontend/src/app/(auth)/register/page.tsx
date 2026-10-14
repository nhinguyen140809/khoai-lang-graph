import { RegisterPage } from '@/features/account'
import { nextParam } from '@/shared/config/routes'

export default async function Page({ searchParams }: PageProps<'/register'>) {
  return <RegisterPage next={nextParam(await searchParams)} />
}
