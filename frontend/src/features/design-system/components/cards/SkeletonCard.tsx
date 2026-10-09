import { Skeleton } from '@/components/ui/skeleton'

import { SampleCard } from '../Sample'

const rows = ['row-1', 'row-2', 'row-3']

export function SkeletonCard() {
  return (
    <SampleCard
      title="Loading"
      description="Skeleton while items load."
      className="flex flex-col gap-3"
    >
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </SampleCard>
  )
}
