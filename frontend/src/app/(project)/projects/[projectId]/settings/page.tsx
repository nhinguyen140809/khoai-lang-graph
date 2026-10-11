import { SettingsPage } from '@/features/project-settings'

export default async function Page({ params }: PageProps<'/projects/[projectId]/settings'>) {
  const { projectId } = await params
  return <SettingsPage projectId={projectId} />
}
