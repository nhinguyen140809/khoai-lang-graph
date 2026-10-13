'use client'

import {
  BellIcon,
  FileStackIcon,
  GitForkIcon,
  type LucideIcon,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
  SquareChevronRightIcon,
  XIcon,
} from 'lucide-react'

import { LogoMark } from '@/shared/components/frame'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { Card } from '@/shared/components/ui/card'
import { Kbd } from '@/shared/components/ui/kbd'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/shared/components/ui/resizable'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Separator } from '@/shared/components/ui/separator'

import { ArtifactTree } from '../ArtifactTree'

const features = [
  { label: 'Console', Icon: SquareChevronRightIcon },
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
      <div className="flex h-12 items-center gap-3 border-b bg-sidebar px-3 text-sm">
        <LogoMark />
        <span className="text-muted-foreground">khoai /</span>
        <span className="font-medium">Mentor platform</span>
        <div className="ml-auto flex h-8 w-72 items-center gap-2 rounded-md border bg-background px-3 text-muted-foreground">
          <SearchIcon className="size-4" />
          Search or run a command
          <Kbd className="ml-auto">Ctrl K</Kbd>
        </div>
      </div>
      <div className="flex h-80">
        <nav
          aria-label="Features"
          className="flex w-16 flex-col items-center gap-1 border-r bg-sidebar py-2"
        >
          {features.map(({ label, Icon, active }) => (
            <FeatureItem key={label} label={label} Icon={Icon} active={active === true} />
          ))}
          <div className="mt-auto">
            <FeatureItem label="Settings" Icon={SettingsIcon} active={false} />
          </div>
        </nav>
        <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize="24" minSize="15">
            <ScrollArea className="h-full bg-sidebar">
              <div className="flex flex-col py-2 text-sidebar-foreground">
                <span className="px-3 pb-1 text-sm font-semibold">Artifacts</span>
                <ArtifactTree className="px-1" />
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize="46" minSize="30">
            <div className="flex h-full flex-col">
              <div className="flex h-10 items-stretch border-b bg-sidebar text-sm">
                <span className="flex items-center gap-2 border-r bg-background px-3">
                  REQ-001 Search mentors
                  <XIcon className="size-3.5 text-muted-foreground" />
                </span>
                {/* The preview tab: the next page opened replaces it. */}
                <span className="flex items-center gap-2 border-r px-3 text-muted-foreground">
                  <span className="italic">Requirement specification</span>
                  <XIcon className="size-3.5" />
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
                <dl className="flex flex-col gap-y-1.5 text-xs">
                  {fields.map(([label, value]) => (
                    <div key={label} className="flex gap-x-3">
                      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
                      <dd className="min-w-0 flex-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
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
      <div className="flex h-8 items-center gap-3 bg-sidebar px-3 text-xs text-sidebar-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning-strong" aria-hidden />
          Waiting for you: Analysis review
        </span>
        <BellIcon aria-hidden className="ml-auto size-4 text-muted-foreground" />
      </div>
    </Card>
  )
}

interface FeatureItemProps {
  label: string
  Icon: LucideIcon
  /** The feature whose side panel is shown. */
  active: boolean
}

/** An item of the activity bar: the icon in a rounded shape, the name under it. */
function FeatureItem({ label, Icon, active }: FeatureItemProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className="group/item flex w-14 flex-col items-center gap-1 rounded-md py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:font-medium aria-pressed:text-foreground"
    >
      <span
        aria-hidden
        className="flex h-7 w-10 items-center justify-center rounded-full group-hover/item:group-not-aria-pressed/item:bg-sidebar-accent/60 group-aria-pressed/item:bg-sidebar-accent"
      >
        <Icon className="size-5" />
      </span>
      <span className="max-w-full truncate px-0.5 text-xs">{label}</span>
    </button>
  )
}
