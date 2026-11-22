'use client'

import type { ReactNode } from 'react'

import { FaceRulesContext } from './FaceRulesContext'
import type { FaceRules } from './look/face-look.types'

/** Gives every face below it the rules that decide which faces can be, in the place of the default ones. */
export function FaceRulesProvider({ rules, children }: { rules: FaceRules; children: ReactNode }) {
  return <FaceRulesContext value={rules}>{children}</FaceRulesContext>
}
