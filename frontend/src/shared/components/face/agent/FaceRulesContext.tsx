'use client'

import { createContext } from 'react'

import { defaultFaceRules } from './look/face-look.constants'
import type { FaceRules } from './look/face-look.types'

/** The rules that the faces below follow: the default ones until a provider gives others. */
export const FaceRulesContext = createContext<FaceRules>(defaultFaceRules)
