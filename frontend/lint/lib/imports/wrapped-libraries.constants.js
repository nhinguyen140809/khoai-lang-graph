// The visible parts of these libraries are wrapped in src/shared/components/ui, where they take
// the design system tokens. Code outside that folder uses the wrappers.
export const wrappedLibraryImports = [
  { name: 'streamdown', message: 'Use Markdown from @/shared/components/ui/markdown.' },
  { name: '@streamdown/code', message: 'Use Markdown from @/shared/components/ui/markdown.' },
  {
    name: 'react-resizable-panels',
    message: 'Use the components in @/shared/components/ui/resizable.',
  },
  {
    name: '@xyflow/react',
    importNames: ['default', 'ReactFlow', 'Handle', 'BaseEdge'],
    message:
      'Use Flow from @/shared/components/ui/flow, Handle from @/shared/components/ui/handle, and Edge from @/shared/components/ui/edge.',
  },
  {
    name: 'recharts',
    importNames: ['ResponsiveContainer', 'Tooltip', 'Legend'],
    message: 'Use ChartContainer, ChartTooltip, and ChartLegend from @/shared/components/ui/chart.',
  },
  {
    name: 'sonner',
    importNames: ['Toaster'],
    message: 'Use Toaster from @/shared/components/ui/sonner.',
  },
]
