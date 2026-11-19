import type { ComponentType, ReactNode, SVGProps } from 'react'

import { Loop, LoopStep } from '@/shared/components/animation'

// Sketches of the layouts, drawn with strokes in the color of the text around them, so that they
// follow the theme and read as plans, not as screenshots. While a sketch plays, its parts come in
// one after another in a loop; a sketch that does not play is still and complete.

export type Sketch = ComponentType<SketchProps>

interface SketchProps {
  className?: string | undefined
  /** Plays the sketch in a loop. */
  isPlaying?: boolean | undefined
  /** Plays it once and leaves it complete, instead of in a loop. */
  once?: boolean | undefined
}

/** The window that every layout is drawn in: the strokes, the ratio and the outline of the app. */
function AppWindow({
  className,
  isPlaying,
  once,
  children,
}: SketchProps & { children: ReactNode }) {
  const props: SVGProps<SVGSVGElement> = {
    viewBox: '0 0 160 100',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className,
  }
  return (
    <svg {...props}>
      <rect x="2" y="2" width="156" height="96" rx="6" />
      <Loop isPlaying={isPlaying} once={once}>
        {children}
      </Loop>
    </svg>
  )
}

/** The layout of the guided view: the list of projects at the left, the chat and its prompt beside it. */
function ChatSketch(props: SketchProps) {
  return (
    <AppWindow {...props}>
      <path d="M38 2v96" />
      <path d="M10 16h20M10 26h16M10 36h18M10 46h14" />
      <path d="M50 16h24" />
      <LoopStep at={0.05}>
        <rect x="86" y="28" width="62" height="14" rx="5" />
      </LoopStep>
      <LoopStep at={0.25}>
        <path d="M52 56h60M52 66h44" />
      </LoopStep>
      <rect x="48" y="80" width="102" height="12" rx="6" />
      <circle cx="141" cy="86" r="3" />
    </AppWindow>
  )
}

/**
 * The workbench of the developer view as a whole: the top bar with its search, the activity bar at
 * the left, the side panel, the tabs over the page, and the status bar. The chrome is drawn lighter
 * than the page in it, which `children` draw in the box x 52 to 154, y 28 to 86.
 */
function WorkbenchSketch({ children, ...props }: SketchProps & { children: ReactNode }) {
  return (
    <AppWindow {...props}>
      <g opacity={0.5}>
        <path d="M2 14h156M2 90h156M14 14v76M48 14v76M48 24h110" />
        <rect x="52" y="5" width="56" height="6" rx="3" />
        <circle cx="8" cy="24" r="2" />
        <circle cx="8" cy="34" r="2" />
        <circle cx="8" cy="44" r="2" />
        <circle cx="8" cy="54" r="2" />
        <path d="M19 22h24M19 30h18M19 38h22M19 46h14" />
        <rect x="52" y="16" width="22" height="6" rx="2" />
        <rect x="78" y="16" width="22" height="6" rx="2" />
        <path d="M6 94h20M120 94h32" />
      </g>
      {children}
    </AppWindow>
  )
}

/** The activity in the workbench: the entries of the work come in a column, and the prompt is under them. */
function ActivitySketch(props: SketchProps) {
  return (
    <WorkbenchSketch {...props}>
      <LoopStep at={0.05}>
        <rect x="96" y="27" width="54" height="10" rx="4" />
      </LoopStep>
      <LoopStep at={0.2}>
        <path d="M56 46h40M56 53h56" />
      </LoopStep>
      <LoopStep at={0.4}>
        <path d="M56 62h50" />
      </LoopStep>
      <rect x="54" y="72" width="98" height="12" rx="6" />
    </WorkbenchSketch>
  )
}

/** A document in the workbench: its title, then its text in paragraphs. */
function DocumentSketch(props: SketchProps) {
  return (
    <WorkbenchSketch {...props}>
      <LoopStep at={0.05}>
        <path d="M56 34h36" strokeWidth={2.5} />
      </LoopStep>
      <LoopStep at={0.2}>
        <path d="M56 44h92M56 51h84M56 58h88" />
      </LoopStep>
      <LoopStep at={0.45}>
        <path d="M56 69h64M56 76h74" />
      </LoopStep>
    </WorkbenchSketch>
  )
}

/** The trace in the workbench: items come in, then the links that lead from one to another. */
function TraceSketch(props: SketchProps) {
  return (
    <WorkbenchSketch {...props}>
      <LoopStep at={0.05}>
        <rect x="56" y="52" width="20" height="14" rx="3" />
      </LoopStep>
      <LoopStep at={0.22}>
        <path d="M76 56l12-14M76 62l12 13" />
        <rect x="88" y="32" width="20" height="14" rx="3" />
        <rect x="88" y="68" width="20" height="14" rx="3" />
      </LoopStep>
      <LoopStep at={0.45}>
        <path d="M108 41l16 14M108 75l16-14" />
        <rect x="124" y="52" width="20" height="14" rx="3" />
      </LoopStep>
    </WorkbenchSketch>
  )
}

export const sketches = {
  chat: ChatSketch,
  activity: ActivitySketch,
  document: DocumentSketch,
  trace: TraceSketch,
} as const satisfies Record<string, Sketch>
