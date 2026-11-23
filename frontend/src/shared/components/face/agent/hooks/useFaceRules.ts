'use client'

import { use } from 'react'

import { FaceRulesContext } from '../FaceRulesContext'
import type { FaceRules } from '../look/face-look.types'

/** The rules that the faces follow here: the ones of the provider above, else the default ones. */
export function useFaceRules(): FaceRules {
  return use(FaceRulesContext)
}
