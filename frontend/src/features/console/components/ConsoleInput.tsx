'use client'

import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'

import { useModifierKeyName } from '@/hooks/useModifierKeyName'
import { cn } from '@/lib/utils'

import { type CommandName, findCommand } from '../commands.constants'
import { useMentionItems } from '../hooks/useMentionItems'
import {
  commandPrefix,
  insertMention,
  itemLabel,
  matchingCommands,
  mentionAtCursor,
} from '../input.utils'
import { PromptMark } from './EventRow'

// How long a first Esc waits for the second one that stops the run.
const STOP_CONFIRM_MS = 3000

interface MenuItem {
  id: string
  label: string
  detail: string
  /** Why the item cannot be chosen; null when it can. */
  disabledReason: string | null
  choose: () => void
}

interface ConsoleInputProps {
  projectId: string
  /** Why each command cannot run now; null when it can. */
  commandReasons: Record<CommandName, string | null>
  /** Whether a message can start a run: only while no run is unfinished. */
  canSend: boolean
  /** Sends the message; the box is cleared when it resolves and kept when it rejects. */
  onSend: (text: string) => Promise<unknown>
  onCommand: (name: CommandName) => void
  /** Whether `Esc` can stop a run. */
  canStop: boolean
  expandAll: boolean
}

/**
 * The input box of the console, with a prompt at its left. Enter sends, Shift+Enter
 * adds a line. `/` at the start lists the commands and `@` lists the items to mention.
 */
export function ConsoleInput({
  projectId,
  commandReasons,
  canSend,
  onSend,
  onCommand,
  canStop,
  expandAll,
}: ConsoleInputProps) {
  const listId = useId()
  const modifier = useModifierKeyName().toLowerCase()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [cursor, setCursor] = useState(0)
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [stopArmed, setStopArmed] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const prefix = commandPrefix(value)
  const mention = prefix === null && canSend ? mentionAtCursor(value, cursor) : null
  const mentions = useMentionItems(projectId, mention?.query ?? null)

  useEffect(() => {
    if (!stopArmed) return
    const timer = setTimeout(() => {
      setStopArmed(false)
    }, STOP_CONFIRM_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [stopArmed])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // A first Esc counts only while there is a run to stop.
  const armed = stopArmed && canStop

  const items: MenuItem[] = []
  if (prefix !== null) {
    for (const command of matchingCommands(prefix)) {
      const disabledReason = commandReasons[command.name]
      items.push({
        id: `command-${command.name}`,
        label: `/${command.name}`,
        detail: disabledReason ?? command.description,
        disabledReason,
        choose: () => {
          setValue('')
          onCommand(command.name)
        },
      })
    }
  } else if (mention !== null) {
    for (const item of mentions.data ?? []) {
      items.push({
        id: `mention-${item.id}`,
        label: item.key,
        detail: itemLabel(item.content),
        disabledReason: null,
        choose: () => {
          const next = insertMention(value, mention, cursor, item.key)
          setValue(next.text)
          setCursor(next.cursor)
        },
      })
    }
  }
  const menuOpen = (prefix !== null || mention !== null) && dismissed !== value
  const activeIndex = Math.min(active, Math.max(0, items.length - 1))
  const activeItem = menuOpen ? items[activeIndex] : undefined

  const send = async () => {
    const text = value.trim()
    if (text === '' || sending) return
    if (text.startsWith('/')) {
      // A command typed in full runs the same as one chosen from the list.
      const command = findCommand(text)
      const reason = command === null ? null : commandReasons[command.name]
      if (command === null) {
        setNotice(`Unknown command: ${text.split(/\s/)[0] ?? text}`)
      } else if (reason !== null) {
        setNotice(`/${command.name}: ${reason}`)
      } else {
        setNotice(null)
        setValue('')
        onCommand(command.name)
      }
      return
    }
    if (!canSend) {
      setNotice('A run is in progress. Use a command, such as /stop.')
      return
    }
    setNotice(null)
    setSending(true)
    try {
      await onSend(text)
      setValue('')
    } catch {
      // The failure is reported where the request is made; the text stays to be sent again.
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return
    if (menuOpen && items.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : items.length - 1
        setActive((activeIndex + step) % items.length)
        return
      }
      if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
        event.preventDefault()
        if (activeItem?.disabledReason === null) activeItem.choose()
        return
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      if (menuOpen) {
        setDismissed(value)
      } else if (canStop) {
        if (armed) {
          setStopArmed(false)
          onCommand('stop')
        } else {
          setStopArmed(true)
        }
      }
      return
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 p-4 pt-2">
      <div className="relative">
        {menuOpen && items.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={prefix === null ? 'Items' : 'Commands'}
            className="absolute right-0 bottom-full left-0 mb-1 max-h-56 overflow-auto rounded-md border bg-popover p-1 font-mono text-xs shadow-md"
          >
            {items.map((item, index) => (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={index === activeIndex}
                aria-disabled={item.disabledReason !== null}
                onMouseDown={(event) => {
                  event.preventDefault()
                  if (item.disabledReason === null) item.choose()
                }}
                className={cn(
                  'flex cursor-pointer items-baseline gap-3 rounded-sm px-2 py-1',
                  index === activeIndex && 'bg-accent',
                  item.disabledReason !== null && 'cursor-default text-muted-foreground',
                )}
              >
                <span className="shrink-0 font-medium">{item.label}</span>
                <span className="truncate text-muted-foreground">{item.detail}</span>
              </li>
            ))}
          </ul>
        )}
        {menuOpen && prefix === null && items.length === 0 && mention !== null && (
          <p className="absolute right-0 bottom-full left-0 mb-1 rounded-md border bg-popover px-2 py-1 font-mono text-xs text-muted-foreground shadow-md">
            {mention.query === ''
              ? 'Type a key, such as REQ-001, or a word of an item.'
              : mentions.isPending
                ? 'Searching...'
                : 'No item matches.'}
          </p>
        )}
        <div className="flex items-start gap-2 border-y bg-muted py-2 pr-2 font-mono text-xs">
          <span className="flex h-lh w-4 shrink-0 items-center justify-center">
            <PromptMark />
          </span>
          <label htmlFor={`${listId}-input`} className="sr-only">
            Message
          </label>
          <textarea
            id={`${listId}-input`}
            ref={inputRef}
            value={value}
            rows={1}
            role="combobox"
            aria-expanded={menuOpen && items.length > 0}
            aria-controls={menuOpen && items.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              activeItem === undefined ? undefined : `${listId}-${activeItem.id}`
            }
            placeholder={
              canSend
                ? 'Describe what to build, @ to mention an item, / for a command'
                : '/ for a command'
            }
            onChange={(event) => {
              setValue(event.target.value)
              setCursor(event.target.selectionStart)
              setActive(0)
              setDismissed(null)
              setNotice(null)
            }}
            onSelect={(event) => {
              setCursor(event.currentTarget.selectionStart)
            }}
            onKeyDown={handleKeyDown}
            className="field-sizing-content max-h-40 min-h-4 flex-1 resize-none bg-transparent leading-snug caret-block outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      {notice !== null && (
        <p role="status" className="px-1 font-mono text-xs text-warning-strong">
          {notice}
        </p>
      )}
      <p className="flex gap-4 px-1 font-mono text-2xs text-muted-foreground">
        <span>
          {modifier}+o {expandAll ? 'collapse' : 'expand'} steps
        </span>
        {canStop && (
          <span className={cn(armed && 'text-warning-strong')}>
            {armed ? 'press esc again to stop the run' : 'esc stop run'}
          </span>
        )}
      </p>
    </div>
  )
}
