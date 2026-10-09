'use client'

import { type CodePluginOptions, createCodePlugin } from '@streamdown/code'
import { cn } from 'cn'
import * as React from 'react'
import {
  CodeBlockContainer,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  type CodeHighlighterPlugin,
  type ControlsConfig,
  type ExtraProps,
  Streamdown,
  StreamdownContext,
  useIsCodeFenceIncomplete,
} from 'streamdown'

import { Code } from '@/components/ui/code'
import { ScrollArea } from '@/components/ui/scroll-area'

// Code blocks use the Night Owl editor themes: Night Owl Light in the light theme, Night Owl in
// the dark theme.
const codeThemes: NonNullable<CodePluginOptions['themes']> = ['night-owl-light', 'night-owl']
// Typed with the plugin interface of Streamdown, which takes the language as a string, instead of
// the Shiki types of @streamdown/code: their union of every language makes type checks slow.
const codePlugin: CodeHighlighterPlugin = createCodePlugin({ themes: codeThemes })
const plugins = { code: codePlugin }

type HighlightedCode = NonNullable<ReturnType<CodeHighlighterPlugin['highlight']>>

function plainCode(code: string): HighlightedCode {
  return { tokens: code.split('\n').map((line) => [{ content: line, offset: 0 }]) }
}

/** The tokens of `code`: plain at first, highlighted once the highlighter has the language. */
function useHighlightedCode(code: string, language: string, isIncomplete: boolean) {
  const [highlighted, setHighlighted] = React.useState(() => plainCode(code))

  React.useEffect(() => {
    if (!codePlugin.supportsLanguage(language)) {
      setHighlighted(plainCode(code))
      return
    }
    let current = true
    // @streamdown/code also reads `isIncomplete`, so that it does not cache a block that is still
    // streaming in; the Streamdown type leaves it out.
    const options = { code, language, themes: codeThemes, isIncomplete }
    const result = codePlugin.highlight(options, (loaded) => {
      if (current) {
        setHighlighted(loaded)
      }
    })
    if (result) {
      setHighlighted(result)
    }
    return () => {
      current = false
    }
  }, [code, language, isIncomplete])

  return highlighted
}

/**
 * While the code streams in, keeps a code block of limited height scrolled to its end, unless
 * the reader has scrolled up.
 */
function useFollowStreamedCode(enabled: boolean, highlighted: HighlightedCode) {
  const { isAnimating } = React.useContext(StreamdownContext)
  const ref = React.useRef<HTMLPreElement>(null)
  const atEnd = React.useRef(true)

  React.useEffect(() => {
    const viewport = ref.current?.closest('[data-slot=scroll-area-viewport]')
    if (!(enabled && viewport)) {
      return
    }
    const onScroll = () => {
      atEnd.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 24
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', onScroll)
    }
  }, [enabled])

  React.useEffect(() => {
    const viewport = ref.current?.closest('[data-slot=scroll-area-viewport]')
    if (enabled && isAnimating && atEnd.current && viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight })
    }
  }, [enabled, isAnimating, highlighted])

  return ref
}

// Shiki gives CSS property names, such as `font-style`; React takes them in camel case.
function tokenStyle(token: HighlightedCode['tokens'][number][number]) {
  const style: Record<string, string> = {}
  let hasBackground = Boolean(token.bgColor)
  if (token.color) {
    style['--sdm-c'] = token.color
  }
  if (token.bgColor) {
    style['--sdm-tbg'] = token.bgColor
  }
  for (const [name, value] of Object.entries(token.htmlStyle ?? {})) {
    if (name === 'color') {
      style['--sdm-c'] = value
    } else if (name === 'background-color') {
      style['--sdm-tbg'] = value
      hasBackground = true
    } else {
      style[
        name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
      ] = value
    }
  }
  return { style: style as React.CSSProperties, hasBackground }
}

function rootStyle(highlighted: HighlightedCode) {
  const style: Record<string, string> = {}
  if (highlighted.bg) {
    style['--sdm-bg'] = highlighted.bg
  }
  if (highlighted.fg) {
    style['--sdm-fg'] = highlighted.fg
  }
  for (const declaration of (highlighted.rootStyle || '').split(';')) {
    const [name, value] = declaration.split(':').map((part) => part.trim())
    if (name && value) {
      style[name] = value
    }
  }
  return style as React.CSSProperties
}

const lineClasses = 'block'
const numberedLineClasses =
  'block before:mr-4 before:inline-block before:w-6 before:text-right before:font-mono before:text-[13px] before:text-muted-foreground/50 before:content-[counter(line)] before:select-none before:[counter-increment:line]'

/**
 * The body of a code block: the highlighted lines in a ScrollArea, which scrolls sideways for
 * long lines and down past `maxHeight`.
 */
function CodeBlockBody({
  code,
  language,
  className,
  isIncomplete,
  lineNumbers,
  startLine,
  maxHeight,
}: {
  code: string
  language: string
  className: string | undefined
  isIncomplete: boolean
  lineNumbers: boolean
  startLine: number | undefined
  maxHeight: string | undefined
}) {
  const highlighted = useHighlightedCode(code, language, isIncomplete)
  const preRef = useFollowStreamedCode(maxHeight !== undefined, highlighted)

  return (
    <ScrollArea
      scrollbars="both"
      data-streamdown="code-block-body"
      data-language={language}
      // The viewport takes the height limit of the root, so that it scrolls down past it.
      className="rounded-md border border-border bg-background text-sm *:data-[slot=scroll-area-viewport]:max-h-[inherit]"
      style={maxHeight ? { maxHeight } : undefined}
    >
      <pre
        ref={preRef}
        className={cn(
          className,
          'w-max min-w-full bg-(--sdm-bg,inherit) p-4 dark:bg-(--shiki-dark-bg,var(--sdm-bg,inherit))',
        )}
        style={rootStyle(highlighted)}
      >
        <code
          className={lineNumbers ? '[counter-increment:line_0] [counter-reset:line]' : undefined}
          style={
            lineNumbers && startLine && startLine > 1
              ? { counterReset: `line ${String(startLine - 1)}` }
              : undefined
          }
        >
          {highlighted.tokens.map((line, lineIndex) => (
            // The lines have no identity of their own; they only change by streaming in.
            <span key={lineIndex} className={lineNumbers ? numberedLineClasses : lineClasses}>
              {line.length === 0 || (line.length === 1 && line[0]?.content === '')
                ? '\n'
                : line.map((token, tokenIndex) => {
                    const { style, hasBackground } = tokenStyle(token)
                    return (
                      <span
                        key={tokenIndex}
                        className={cn(
                          'text-(--sdm-c,inherit) dark:text-(--shiki-dark,var(--sdm-c,inherit))',
                          hasBackground &&
                            'bg-(--sdm-tbg) dark:bg-(--shiki-dark-bg,var(--sdm-tbg))',
                        )}
                        style={style}
                        {...token.htmlAttrs}
                      >
                        {token.content}
                      </span>
                    )
                  })}
            </span>
          ))}
        </code>
      </pre>
    </ScrollArea>
  )
}

function codeControl(controls: ControlsConfig, name: 'copy' | 'download') {
  if (typeof controls === 'boolean') {
    return controls
  }
  if (typeof controls.code === 'object') {
    return controls.code[name] !== false
  }
  return controls.code !== false
}

function maxHeightOf(value: number | string) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? `${String(value)}px` : undefined
  }
  return value === '0' || value === 'none' || value === 'Infinity' ? undefined : value
}

function codeText(children: React.ReactNode) {
  if (typeof children === 'string') {
    return children
  }
  if (
    React.isValidElement<{ children?: unknown }>(children) &&
    typeof children.props.children === 'string'
  ) {
    return children.props.children
  }
  return ''
}

/**
 * Streamdown's code element. Inline code is a Code of the body text size. Code blocks keep the
 * frame, the header, and the buttons of Streamdown, and show their body in a ScrollArea instead of
 * a native scroll container. Markdown has no Mermaid plugin, so every fenced block is code.
 */
function MarkdownCode({
  node,
  className,
  children,
  ...props
}: React.ComponentProps<'code'> & ExtraProps) {
  const isIncomplete = useIsCodeFenceIncomplete()
  const { controls, lineNumbers, codeBlockMaxHeight } = React.useContext(StreamdownContext)

  if (!('data-block' in props)) {
    return (
      <Code
        size="lg"
        className={className}
        data-streamdown="inline-code"
        {...props}
        // The HTML color attribute of the code element would clash with the tone prop of Code.
        color={undefined}
      >
        {children}
      </Code>
    )
  }

  const language = /language-(\S+)/.exec(className ?? '')?.[1] ?? ''
  const code = codeText(children).replace(/\n+$/, '')
  const meta = node?.properties.metastring
  const metastring = typeof meta === 'string' ? meta : ''
  const startLine = Number.parseInt(/startLine=(\d+)/.exec(metastring)?.[1] ?? '', 10)
  const showCopy = codeControl(controls, 'copy')
  const showDownload = codeControl(controls, 'download')

  return (
    <CodeBlockContainer dir="ltr" isIncomplete={isIncomplete} language={language}>
      <CodeBlockHeader language={language} />
      {(showCopy || showDownload) && (
        <div className="pointer-events-none sticky top-2 z-10 -mt-10 flex h-8 items-center justify-end">
          <div
            data-streamdown="code-block-actions"
            className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-backdrop-filter:bg-sidebar/70 supports-backdrop-filter:backdrop-blur"
          >
            {showDownload && <CodeBlockDownloadButton code={code} language={language} />}
            {showCopy && <CodeBlockCopyButton code={code} />}
          </div>
        </div>
      )}
      <CodeBlockBody
        code={code}
        language={language}
        className={className}
        isIncomplete={isIncomplete}
        lineNumbers={lineNumbers && !/\bnoLineNumbers\b/.test(metastring)}
        startLine={startLine >= 1 ? startLine : undefined}
        maxHeight={maxHeightOf(codeBlockMaxHeight)}
      />
    </CodeBlockContainer>
  )
}

const components = { code: MarkdownCode }

// Markdown sets the plugins, the code themes, and the code element itself.
type MarkdownProps = Omit<
  React.ComponentProps<typeof Streamdown>,
  'plugins' | 'shikiTheme' | 'components'
>

// Headings take the sizes of the page headings in styles.css instead of the larger ones of
// Streamdown.
const headingClasses =
  '[&_:is(h1,h2,h3,h4,h5,h6)]:font-medium [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_:is(h4,h5,h6)]:text-xs'

/** Renders Markdown, also while it is still streaming in. */
function Markdown({ className, ...props }: MarkdownProps) {
  return (
    <Streamdown
      className={cn('text-sm/relaxed', headingClasses, className)}
      plugins={plugins}
      shikiTheme={codeThemes}
      components={components}
      {...props}
    />
  )
}

export { Markdown }
