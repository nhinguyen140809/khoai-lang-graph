import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { MatrixPanel } from '@/features/traceability'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/traceability'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="traceability"
      side={
        <SidePanel title="Traceability">
          <MatrixPanel projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
