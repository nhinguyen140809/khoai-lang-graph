import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { ArtifactsPanel } from '@/features/artifacts'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/artifacts'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="artifacts"
      side={
        <SidePanel title="Artifacts">
          <ArtifactsPanel projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
