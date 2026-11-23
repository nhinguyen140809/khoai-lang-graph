'use client'

import { AudioLinesIcon, XIcon } from 'lucide-react'
import type { ComponentProps, ComponentType } from 'react'

import { AnimatedSize } from '@/shared/components/animation'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { dictationMessages } from './dictation.constants'
import type { DictationSize } from './dictation.types'
import { DictationBars } from './DictationBars'
import { useDictationContext } from './hooks/useDictationContext'

/** What the button shows while it listens: the bars of a voice, as many as the place gives it, and its name. */
function ListeningContent({ size }: { size: DictationSize }) {
  const dictation = useDictationContext()
  if (dictation === null) return null

  return (
    <>
      <DictationBars level={dictation.level} isMetered={dictation.isMetered} size={size} />
      {dictationMessages.stopDictating}
    </>
  )
}

/** What the button shows while it waits: the icon alone. */
function IdleContent() {
  return <AudioLinesIcon aria-hidden />
}

/** The button that cancels the dictation and puts the text back as it was; it comes in beside the one that stops it. */
function CancelCompanion() {
  const dictation = useDictationContext()
  if (dictation === null) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          color="neutral"
          size="icon-sm"
          aria-label={dictationMessages.cancelDictating}
          onClick={dictation.cancel}
        >
          <XIcon aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dictationMessages.cancelDictating}</TooltipContent>
    </Tooltip>
  )
}

type DictationState = 'idle' | 'listening'

interface DictationLook {
  variant: ComponentProps<typeof Button>['variant']
  color: ComponentProps<typeof Button>['color']
  size: ComponentProps<typeof Button>['size']
  /** The name of the button, and what a screen reader says of the state. */
  label: string
  status: string
  /** What the button holds, and what stands beside it. */
  Content: ComponentType<{ size: DictationSize }>
  Companion: ComponentType | null
}

// How the one button looks in each state, looked up by state: a new state is a new entry, and
// nothing below branches on which one it is. The button is the same element in both, so the change
// of its color runs and the box that holds it grows to its new size.
const dictationLooks: Record<DictationState, DictationLook> = {
  idle: {
    variant: 'ghost',
    color: 'neutral',
    size: 'icon-sm',
    label: dictationMessages.dictate,
    status: '',
    Content: IdleContent,
    Companion: null,
  },
  listening: {
    variant: 'soft',
    color: 'primary',
    size: 'sm',
    label: dictationMessages.stopDictating,
    status: dictationMessages.listening,
    Content: ListeningContent,
    Companion: CancelCompanion,
  },
}

interface DictationButtonProps {
  /** How many bars the button has while it listens, by the kind of place. */
  size: DictationSize
}

/**
 * The button of the dictation around it: one button that starts it. While it listens, the same button turns
 * into the primary color and grows to hold the bars of a voice and its name, which stops it and
 * keeps the text, and a button that cancels it grows in beside it. They grow and shrink over a
 * short time instead of jumping. Nothing is drawn in a browser that cannot listen.
 */
export function DictationButton({ size }: DictationButtonProps) {
  const dictation = useDictationContext()
  if (dictation?.isSupported !== true) return null
  const state: DictationState = dictation.isListening ? 'listening' : 'idle'
  const look = dictationLooks[state]
  const onClick = { idle: dictation.start, listening: dictation.stop }[state]

  return (
    // The padding and the negative margin keep the focus rings, which the box clips otherwise.
    <AnimatedSize className="-m-1" contentClassName="flex items-center gap-1 p-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={look.variant}
            color={look.color}
            size={look.size}
            aria-label={look.label}
            onClick={onClick}
          >
            <look.Content size={size} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{look.label}</TooltipContent>
      </Tooltip>
      {look.Companion !== null && <look.Companion />}
      <span role="status" className="sr-only">
        {look.status}
      </span>
    </AnimatedSize>
  )
}
