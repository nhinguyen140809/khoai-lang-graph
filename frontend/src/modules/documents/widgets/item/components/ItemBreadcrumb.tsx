import Link from 'next/link'
import { Fragment } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { routes } from '@/shared/routes'

import { useItemPageContext } from '../hooks/useItemPageContext'
import { itemPageMessages } from '../item-page.constants'

/** Where the item sits: its document, the sections and the group above it, and its own title. */
export function ItemBreadcrumb() {
  const { projectId, record, page } = useItemPageContext()
  const project = routes.project(projectId)

  return (
    <Breadcrumb aria-label={itemPageMessages.location}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {page.documentTitle === null ? (
            <BreadcrumbPage>{itemPageMessages.titleLoading}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={project.document(record.artifact_id)}>{page.documentTitle}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {page.steps.map((step) => (
          <Fragment key={step.id}>
            <BreadcrumbSeparator>{itemPageMessages.separator}</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{step.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator>{itemPageMessages.separator}</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{page.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
