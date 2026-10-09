'use client'

import {
  FileStackIcon,
  GitForkIcon,
  MessageSquareIcon,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { ArtifactTree } from '../ArtifactTree'

const features = [
  { label: 'Chat', Icon: MessageSquareIcon },
  { label: 'Artifacts', Icon: FileStackIcon, active: true },
  { label: 'Workflow', Icon: NetworkIcon },
  { label: 'Traceability', Icon: GitForkIcon },
]

const fields = [
  ['Statement', 'The system shall let a student search mentors by field and availability.'],
  ['Type', 'functional'],
  ['Priority', 'must'],
  ['Verification', 'test'],
]

const chatLines = [
  { mark: '>', text: 'I want an online platform for students to find mentors.' },
  { mark: '*', text: 'planner  Elicitation plan v1  0:21' },
  { mark: '*', text: 'interview  PER-001 Student, 12 turns  2:10' },
  { mark: '*', text: 'analyst  24 AR  3 AMB  1 CONF  0:52' },
  { mark: '?', text: 'Review: Requirements analysis v4' },
]

/** The VS Code-like frame of the app, assembled from the components on this page. */
export function WorkspaceCard() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex h-9 items-center gap-3 border-b bg-sidebar px-3 text-xs">
        <span className="flex size-5 items-center justify-center rounded-sm bg-primary text-[0.625rem] font-semibold text-primary-foreground">
          K
        </span>
        <span className="text-muted-foreground">khoai /</span>
        <span className="font-medium">Mentor platform</span>
        <div className="ml-auto flex h-6 w-72 items-center gap-2 rounded-md border bg-background px-2 text-muted-foreground">
          <SearchIcon className="size-3.5" />
          Search or run a command
          <Kbd className="ml-auto">Ctrl K</Kbd>
        </div>
      </div>
      <div className="flex h-80">
        <nav
          aria-label="Features"
          className="flex w-11 flex-col items-center gap-1 border-r bg-sidebar py-2"
        >
          {features.map(({ label, Icon, active }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant={active ? 'solid' : 'ghost'}
                  color="neutral"
                  size="icon-sm"
                  aria-label={label}
                >
                  <Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
          <Button variant="ghost" size="icon-sm" aria-label="Settings" className="mt-auto">
            <SettingsIcon />
          </Button>
        </nav>
        <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize="24" minSize="15">
            <ScrollArea className="h-full bg-sidebar">
              <div className="flex flex-col py-2 text-sidebar-foreground">
                <span className="px-3 pb-1 text-[0.625rem] font-medium tracking-wide uppercase">
                  Artifacts
                </span>
                <ArtifactTree className="px-1" />
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="46" minSize="30">
            <div className="flex h-full flex-col">
              <div className="flex h-8 items-stretch border-b bg-sidebar text-xs">
                <span className="flex items-center gap-2 border-r bg-background px-3">
                  REQ-001 Search mentors
                  <XIcon className="size-3 text-muted-foreground" />
                </span>
                <span className="flex items-center px-3 text-muted-foreground">
                  Requirement specification
                </span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>Requirement specification</BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>3.1</BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>REQ-001</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h2>REQ-001 Search mentors</h2>
                <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1.5 text-xs">
                  {fields.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="30" minSize="20">
            <div className="flex h-full flex-col gap-1 p-3 font-mono text-xs">
              {chatLines.map((line) => (
                <p key={line.text} className="flex items-center gap-2">
                  {/* Status colors are for marks and fills; text stays in the text colors. */}
                  {line.mark === '?' ? (
                    <span className="flex w-2 justify-center" aria-hidden>
                      <span className="size-1.5 rounded-full bg-warning-strong" />
                    </span>
                  ) : (
                    <span className="w-2 text-primary">{line.mark}</span>
                  )}
                  <span>{line.text}</span>
                </p>
              ))}
              <div className="mt-auto rounded-md border px-2 py-1.5 text-muted-foreground">
                &gt; Message, @ to mention an item
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <Separator />
      <div className="flex h-6 items-center gap-3 bg-sidebar px-3 font-mono text-[0.625rem] text-sidebar-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning-strong" aria-hidden />
          Run 3: waiting for review
        </span>
        <span>analysis_review</span>
        <span>step 67</span>
        <span className="ml-auto">$0.42 of $2.00</span>
        <span>workflow v1</span>
      </div>
    </Card>
  )
}
