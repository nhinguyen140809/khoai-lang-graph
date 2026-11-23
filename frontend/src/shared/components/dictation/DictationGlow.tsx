'use client'

import { motion, type MotionValue, useTransform } from 'motion/react'

import { Glow, usePresence } from '@/shared/components/animation'

import { useDictationContext } from './hooks/useDictationContext'

// How long the light takes to fade, which the class `duration-300` of its box says too.
const fadeMs = 300

interface GlowLightProps {
  isListening: boolean
  /** The level of the voice, from 0 to 1, which the light follows. */
  level: MotionValue<number>
  /** Whether the level is real; the light breathes on its own when it is not. */
  isMetered: boolean
}

/**
 * The light itself: it comes in and goes out with `isListening`, and swells and brightens with the
 * voice. It is drawn only while it shows and while it fades out, so that what is not
 * listening keeps no animation running.
 */
function GlowLight({ isListening, level, isMetered }: GlowLightProps) {
  const isMounted = usePresence(isListening, fadeMs)
  const scaleX = useTransform(level, (value) => 1 + value * 0.5)
  const scaleY = useTransform(level, (value) => 1 + value * 0.25)
  const opacity = useTransform(level, (value) => 0.4 + value * 0.6)

  return (
    <div
      aria-hidden
      data-active={isListening}
      className="pointer-events-none absolute inset-x-1/4 -inset-y-2 opacity-0 transition-opacity duration-300 data-[active=true]:opacity-100 motion-reduce:transition-none"
    >
      {/* The voice moves the glow, so its own motion and entrance are off; without a level it breathes. */}
      {isMounted && (
        <motion.div style={isMetered ? { scaleX, scaleY, opacity } : {}} className="size-full">
          <Glow
            strength={100}
            shape="streak"
            blur="sm"
            width="100%"
            height="100%"
            entrance="none"
            motion={isMetered ? 'none' : 'pulse'}
            className="size-full"
          />
        </motion.div>
      )}
    </div>
  )
}

/**
 * The light of the dictation around it: a `Glow` of the design system in the primary color that
 * fills the box of its parent and a little more, so that it shows over the head and under the foot
 * of what is over it. It swells and brightens with the voice that is heard, wider than taller, and
 * lies thin and dim while nobody speaks. It takes no part in the layout, and there is none in a
 * browser that cannot listen. Put it behind what it lights, in a box that is positioned.
 */
export function DictationGlow() {
  const dictation = useDictationContext()
  if (dictation?.isSupported !== true) return null

  return (
    <GlowLight
      isListening={dictation.isListening}
      level={dictation.level}
      isMetered={dictation.isMetered}
    />
  )
}
