import { SidePanel } from '@/components/layout/SidePanel'
import { Workbench } from '@/components/layout/Workbench'
import { SearchPanel } from '@/features/search'

export default async function Layout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/search'>) {
  const { projectId } = await params
  return (
    <Workbench
      projectId={projectId}
      feature="search"
      side={
        <SidePanel title="Search">
          <SearchPanel projectId={projectId} />
        </SidePanel>
      }
    >
      {children}
    </Workbench>
  )
}
