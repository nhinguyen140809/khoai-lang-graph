import { Workbench } from '@/components/layout/Workbench'

export default async function ChatLayout({
  children,
  params,
}: LayoutProps<'/projects/[projectId]/chat'>) {
  const { projectId } = await params
  return (
    <Workbench projectId={projectId} feature="chat">
      {children}
    </Workbench>
  )
}
