import { FileTextIcon, ListTreeIcon, WorkflowIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

// Placeholders until the artifact viewers, workflow graph, and trace view are built.
export function ArtifactPanel() {
  return (
    <Tabs defaultValue="file" className="flex h-full flex-col p-2">
      <TabsList>
        <TabsTrigger value="file">
          <FileTextIcon aria-hidden />
          File
        </TabsTrigger>
        <TabsTrigger value="graph">
          <WorkflowIcon aria-hidden />
          Graph
        </TabsTrigger>
        <TabsTrigger value="trace">
          <ListTreeIcon aria-hidden />
          Trace
        </TabsTrigger>
      </TabsList>
      <TabsContent value="file" className="p-4 text-sm text-muted-foreground">
        Artifacts produced by agents will appear here.
      </TabsContent>
      <TabsContent value="graph" className="p-4 text-sm text-muted-foreground">
        The live agent graph will appear here.
      </TabsContent>
      <TabsContent value="trace" className="p-4 text-sm text-muted-foreground">
        Step-by-step traces will appear here.
      </TabsContent>
    </Tabs>
  )
}
