import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { SettingsNav } from '@/features/project-settings'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/settings'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="settings"
      side={
        <SidePanel title="Project settings">
          <SettingsNav projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
