'use client'

import { createContext } from 'react'

import { presetFaceRules } from './look/face-look.constants'
import type { FaceRules } from './look/face-look.types'

/** The rules that the faces below follow: the faces made by hand until a provider gives others. */
export const FaceRulesContext = createContext<FaceRules>(presetFaceRules)
