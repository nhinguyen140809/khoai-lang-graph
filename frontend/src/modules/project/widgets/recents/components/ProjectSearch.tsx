'use client'

import { SearchIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/shared/components/ui/input-group'

import { projectRecentsMessages } from '../project-recents.constants'

interface ProjectSearchProps {
  value: string
  onValueChange: (value: string) => void
}

/**
 * The search of the page: a button that opens the box and puts the focus in it. The box closes when
 * it loses the focus empty, or with Escape, which empties it too.
 */
export function ProjectSearch({ value, onValueChange }: ProjectSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => {
    onValueChange('')
    setIsOpen(false)
  }

  if (!isOpen && value === '') {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setIsOpen(true)
          // The box shows in the next frame.
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <SearchIcon aria-hidden />
        <span className="sr-only">{projectRecentsMessages.search}</span>
      </Button>
    )
  }

  return (
    <InputGroup className="w-56 bg-background max-sm:w-40">
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        aria-label={projectRecentsMessages.search}
        placeholder={projectRecentsMessages.search}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
        }}
        onBlur={() => {
          if (value.trim() === '') close()
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" onClick={close}>
          <XIcon aria-hidden />
          <span className="sr-only">{projectRecentsMessages.clearSearch}</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
