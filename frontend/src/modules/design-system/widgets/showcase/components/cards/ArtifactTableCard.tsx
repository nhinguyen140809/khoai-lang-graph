import type { ComponentProps } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

import { type SpecRequirementRow, specRequirements } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

const statusBadge = {
  approved: { color: 'success', variant: 'soft' },
  'needs review': { color: 'warning', variant: 'soft' },
  draft: { color: 'neutral', variant: 'outline' },
} as const satisfies Record<SpecRequirementRow['status'], ComponentProps<typeof Badge>>

export function ArtifactTableCard() {
  return (
    <SampleCard
      title="3.1 Mentor discovery"
      description="Table display of spec requirements, with pagination."
      className="flex flex-col gap-3"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specRequirements.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-mono">{row.key}</TableCell>
              <TableCell className="max-w-40 truncate" title={row.title}>
                {row.title}
              </TableCell>
              <TableCell>
                <Badge {...statusBadge[row.status]}>{row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </SampleCard>
  )
}
