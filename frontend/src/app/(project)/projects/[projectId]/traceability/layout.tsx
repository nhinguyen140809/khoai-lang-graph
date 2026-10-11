import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { TraceabilityNav } from '@/features/traceability'

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
          <TraceabilityNav projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
