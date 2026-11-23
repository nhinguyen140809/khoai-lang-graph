import type { LucideIcon } from 'lucide-react'

/** A document or an item that a message of an agent names. */
export type Reference =
  | { type: 'artifact'; id: string; kind: string; title: string; version: number }
  | { type: 'item'; id: string; key: string; version: number }

/** What a reference shows as: its mark, its title and what it is. */
export interface RefLook {
  label: string
  Mark: LucideIcon
  title: string
  description: string
}
