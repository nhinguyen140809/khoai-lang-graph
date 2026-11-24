import { Avatar, Style } from '@dicebear/core'
import { createElement, type ReactNode } from 'react'

import { isRecord, isString } from '@/shared/lib/guards'
import { hashOf } from '@/shared/lib/palette'

import type { EyesMotion } from '../face.types'
import { humanEyeArt } from './human-eye-art.constants'
import {
  eyesMiddleY,
  faceArt,
  faceCatalog,
  faceCrop,
  monochromePalette,
} from './human-face.constants'
import type {
  EyeLayerOptions,
  EyeRole,
  EyeShape,
  FaceEyeFamily,
  FacePalette,
  FacePart,
  FaceSpec,
  FaceTags,
  FaceVariant,
  HumanDrawing,
  HumanMoodLook,
  IrisSpot,
} from './human-face.types'

/** What the look of a mood asks of the eyes of the face of a person: nothing of their own, and a blink unless they are shut. */
export function eyesMotionOf(look: HumanMoodLook): EyesMotion {
  return { lives: ['steady', 'steady'], canBlink: look.isEyesShut !== true }
}

/** Where along its rounds the face of a seed starts, from 0 up to 1, so that two faces side by side do not move together. */
export function phaseOf(hash: number): number {
  return (hash % 1000) / 1000
}

/** The part of the catalog with this key, if it has one. */
export function partOf(key: string): FacePart | undefined {
  return faceCatalog.parts.find((part) => part.key === key)
}

/** The variant of a part with this key, if it has one. */
export function variantOf(part: string, key: string): FaceVariant | undefined {
  return partOf(part)?.variants.find((variant) => variant.key === key)
}

/** The variants of a part that fit what is asked: for each category of tags that the request names, a variant that has one of the values asked. */
export function variantsFitting(part: string, wanted: FaceTags): FaceVariant[] {
  return (partOf(part)?.variants ?? []).filter((variant) => isFitting(variant.tags, wanted))
}

/** Whether tags fit what is asked: for each kind of tag that the request names, one of the values asked is one of theirs. */
function isFitting(tags: FaceTags, wanted: FaceTags): boolean {
  return Object.entries(wanted).every(
    ([category, values]) =>
      values.length === 0 || values.some((value) => tags[category]?.includes(value)),
  )
}

/** The tags of a token of a role: none for a token that fits every tag. */
function tokenTagsOf(role: string, token: string): FaceTags {
  return (
    faceCatalog.colors.find((color) => color.role === role)?.tokens.find(({ key }) => key === token)
      ?.tags ?? {}
  )
}

/** The palettes of colors that go together, other than the one of black on white, that fit what is asked. */
export function palettesFitting(wanted: FaceTags): FacePalette[] {
  return faceCatalog.palettes.filter(
    ({ key, tags }) => key !== monochromePalette && isFitting(tags, wanted),
  )
}

/** The palette that a face is drawn in: the one that the spec names, or else one of the natural palettes by the seed (the black on white one and the dyed ones are only had by name). */
export function paletteOf(
  spec: FaceSpec | null | undefined,
  seed: string,
): FacePalette | undefined {
  const named = faceCatalog.palettes.find(({ key }) => key === spec?.palette)
  if (named !== undefined) return named
  const natural = faceCatalog.palettes.filter(({ fromSeed }) => fromSeed === true)
  return natural[hashOf(`${seed}:palette`) % natural.length]
}

/** The color that stands in the art for the role, until the token of the face replaces it: one of its own for every role, so that the roles stay apart. */
export function placeholderOf(role: string): string {
  const index = faceCatalog.colors.findIndex((color) => color.role === role)
  return `#7a7a${(index + 16).toString(16)}`
}

/** What paints with the token of a role: the custom property that the style sheet of the face holds its value in. */
export function tokenVar(role: string, token: string): string {
  return `var(--human-face-${role}-${token})`
}

/** The token that each role is drawn in: the one that the spec names, else one by the seed for a role that takes its token so (the background), else the one of the palette of the face. */
export function tokensOf(spec: FaceSpec | null | undefined, seed: string): Record<string, string> {
  const palette = paletteOf(spec, seed)
  return Object.fromEntries(
    faceCatalog.colors.map(({ role, tokens, fromSeed }) => {
      const named = spec?.colors[role]
      const isNamed = named !== undefined && tokens.some(({ key }) => key === named)
      const fallback =
        fromSeed === true
          ? tokens[hashOf(`${seed}:${role}`) % tokens.length]?.key
          : (palette?.tokens[role] ?? tokens[0]?.key)
      return [role, isNamed ? named : (fallback ?? '')]
    }),
  )
}

/** What paints the background of a face: the pastel that the spec names, or that the seed takes. It is the frame of the face, so that it stays where it is while the face moves in it. */
export function backgroundOf(seed: string, spec: FaceSpec | null | undefined): string {
  return tokenVar('background', tokensOf(spec, seed).background ?? '')
}

/** The eyes of a face: the one that the spec names, else one that a seed picks from the eyes that are open (a face at rest has its eyes open; a spec may still name shut ones). */
export function eyesOf(seed: string, spec: FaceSpec | null | undefined): string {
  const variants = partOf('eyes')?.variants ?? []
  const named = spec?.parts.eyes
  if (named !== undefined && named !== null && variants.some(({ key }) => key === named)) {
    return named
  }
  const shut = new Set(
    faceCatalog.eyeFamilies.flatMap(({ members }) =>
      members
        .filter(({ kind }) => kind === 'shut' || kind === 'smile')
        .map(({ variant }) => variant),
    ),
  )
  const open = variants.filter(({ key }) => !shut.has(key))
  const picks = open.length > 0 ? open : variants
  return picks[hashOf(`${seed}:eyes`) % picks.length]?.key ?? ''
}

/** The family of eyes that a variant of the eyes is one of; none for an eye that no family has. */
export function familyOf(variant: string): FaceEyeFamily | undefined {
  return faceCatalog.eyeFamilies.find(({ members }) =>
    members.some((one) => one.variant === variant),
  )
}

/**
 * The eyes that a face with the eyes `rest` has when asked to look as `role`: its own (`rest`), or
 * one of the kind asked from its family, another than its own where there are some (`pick` says
 * which, so that two eyes asked the same take the same). A family with none of the kind asked
 * gives an open eye, and a face with no family, or no other, keeps its own.
 */
export function eyeShapeOf(rest: string, role: EyeRole, pick: number): EyeShape {
  const own: EyeShape = { variant: rest, isFlipped: false, look: null }
  const members = familyOf(rest)?.members ?? []
  if (role === 'rest') return own
  const of = (kind: string) =>
    members.filter(
      (member) => member.kind === kind && (member.variant !== rest || kind === 'smile'),
    )
  const choices = of(role).length > 0 ? of(role) : of('open')
  const chosen = choices[pick % Math.max(choices.length, 1)]
  return chosen === undefined
    ? own
    : { variant: chosen.variant, isFlipped: chosen.isFlipped === true, look: null }
}

/**
 * What the art is asked to draw: the variant of every part that the spec names, or that the mood
 * asks for the mouth (the mood wins, as it is what the face shows now), the eyes of the face (see
 * `eyesOf`), and the seed for every other part. Each role is painted with its own stand-in color, but the background,
 * which the face does not move with (see `backgroundOf`).
 */
export function optionsOf(
  seed: string,
  spec: FaceSpec | null | undefined,
  drawing: HumanDrawing,
): Record<string, unknown> {
  const named: Record<string, string | null> = { ...spec?.parts }
  named.eyes = eyesOf(seed, spec)
  if (drawing.mouth !== null) named.mouth = drawing.mouth
  const options: Record<string, unknown> = { seed }
  for (const [part, key] of Object.entries(named)) {
    if (key === null) {
      if (partOf(part)?.optional === true) options[`${part}Probability`] = 0
      continue
    }
    const variant = variantOf(part, key)
    if (variant === undefined) continue
    options[`${part}Variant`] = variant.art
    if (partOf(part)?.optional === true) options[`${part}Probability`] = 100
  }
  for (const { role, fromSeed } of faceCatalog.colors) {
    if (fromSeed !== true) options[`${role}Color`] = [placeholderOf(role)]
  }
  return options
}

const groupStart = /<g id="([^"]+)">/g
const groupTag = /<(\/?)g\b[^>]*>/g
const useTag = /<use(?: transform="([^"]*)")? href="#([^"]+)"\/>/g

/** The groups of the definitions of a drawing by id, each with what is in it: the art draws a part once and places it with `use`. */
function groupsOf(definitions: string): Map<string, string> {
  const groups = new Map<string, string>()
  for (const open of definitions.matchAll(groupStart)) {
    const from = open.index + open[0].length
    let depth = 1
    groupTag.lastIndex = from
    for (let tag = groupTag.exec(definitions); tag !== null; tag = groupTag.exec(definitions)) {
      depth += tag[1] === '/' ? -1 : 1
      if (depth === 0) {
        groups.set(open[1] ?? '', definitions.slice(from, tag.index))
        break
      }
    }
  }
  return groups
}

/** A path of the eyes as an element, painted with the stand-in color of its role; none where the eyes have no such shape. */
function eyePath(path: string, fill: string): string {
  return path === '' ? '' : `<path d="${path}" fill="${fill}" fill-rule="evenodd"/>`
}

/** Where the iris of the eye on a side of a variant of the eyes is; none for an eye that has no iris. */
export function spotOf(variant: string, side: 'left' | 'right'): IrisSpot | null {
  const art = variantOf('eyes', variant)?.art
  return (art === undefined ? undefined : humanEyeArt[art])?.spots[side] ?? null
}

/**
 * One drawing of the eyes, from the art of the eyes of the faces of people: the white of the eye,
 * the iris with the gleam in it, and over them the lid, each with its own color. A mood change
 * closes the eyes (while their look changes) and a blink closes them for a moment, both as the
 * groups around them; the gaze moves the iris alone, in the lid, and so does a look up or down
 * (the group `human-face-look`). `clipId` is the id that the shape that cuts the iris is given,
 * which is the own of the drawing. An iris that comes from another eye settles in (the group
 * `human-face-settle`, which starts where the other iris was, see `EyeLayerOptions`).
 */
export function eyeLayerMarkup(
  art: string,
  clipId: string,
  { isFlipped, hasIris, settleAt }: EyeLayerOptions,
): string {
  const eyes = humanEyeArt[art]
  if (eyes === undefined) return ''
  const gaze = `<g class="human-face-gaze">${eyePath(eyes.iris, placeholderOf('eyes'))}${eyePath(eyes.shine, 'white')}</g>`
  const settle =
    settleAt === undefined
      ? gaze
      : `<g class="human-face-settle" style="transform-origin: ${String(settleAt.x)}px ${String(settleAt.y)}px">${gaze}</g>`
  const looked = `<g class="human-face-look">${settle}</g>`
  // The iris stays in the eye, over the white of the eye if it has one, where it is cut by its shape.
  const iris =
    eyes.socket === ''
      ? looked
      : `<clipPath id="${clipId}"><path d="${eyes.socket}"/></clipPath><g clip-path="url(#${clipId})">${looked}</g>`
  const flip = isFlipped ? ` transform="translate(0 ${String(eyesMiddleY * 2)}) scale(1 -1)"` : ''
  return `<g class="human-face-cover"><g class="human-face-blink"><g${flip}>${eyePath(
    eyes.white,
    'white',
  )}${hasIris ? iris : ''}${eyePath(eyes.lid, placeholderOf('eyelids'))}</g></g></g>`
}

/** The id of the place of the eyes in the markup of a face: the eyes are not in it, they are put there by the page, which changes them while the face moves. */
export const eyesSlotId = 'human-face-eyes-slot'

/** What a drawing becomes once every `use` is the part itself, so that the parts are elements of the page that a style sheet can move. */
function expand(
  body: string,
  groups: ReadonlyMap<string, string>,
  seen: readonly string[] = [],
): string {
  return body.replace(useTag, (_use, transform: string | undefined, id: string) => {
    const inner = groups.get(id)
    if (inner === undefined || seen.includes(id)) return ''
    const [part] = id.split('-')
    if (part === 'eyes') {
      return `<g id="${eyesSlotId}"${transform === undefined ? '' : ` data-place="${transform}"`}/>`
    }
    return `<g${transform === undefined ? '' : ` transform="${transform}"`}>${expand(inner, groups, [...seen, id])}</g>`
  })
}

/** The masks that parts of the drawing are cut by (the beard is cut by the mouth): the one part of the definitions that is not a group of a part, which a group refers to by id. */
function masksOf(definitions: string): string {
  const masks = definitions.match(/<mask\b[\s\S]*?<\/mask>/g) ?? []
  return masks.length === 0 ? '' : `<defs>${masks.join('')}</defs>`
}

/** A drawing of the art as the markup of one picture of the face, cropped to the head, with each part in the place it is drawn in. */
export function faceMarkup(svg: string): string {
  const [head = '', rest = ''] = svg.split('</defs>')
  const definitions = head.slice(head.indexOf('<defs>'))
  const root = head
    .slice(0, head.indexOf('>') + 1)
    .replace(/ (?:width|height)="[^"]*"/g, '')
    .replace(/viewBox="[^"]*"/, `viewBox="${faceCrop}"`)
    .replace('<svg ', '<svg class="size-full" ')
  const body = rest.replace(/<\/svg>\s*$/, '').replace(/ clip-path="[^"]*"/, '')
  const groups = groupsOf(definitions)
  return `${root}${expand(masksOf(definitions), groups)}${expand(body, groups)}</svg>`
}

/** The stand-in colors of a picture replaced by the custom properties of the tokens that the roles are drawn in, so that the paint itself reads its value from the style sheet. */
export function withTokens(markup: string, tokens: Readonly<Record<string, string>>): string {
  return faceCatalog.colors.reduce(
    (painted, { role }) =>
      painted.replaceAll(
        `fill="${placeholderOf(role)}"`,
        `fill="${tokenVar(role, tokens[role] ?? '')}"`,
      ),
    markup,
  )
}

/** The ids of the masks and of the shapes that cut the irises, in a picture, made its own, so that two faces on a page, whose masks differ in what cuts them (the mouth), do not take each other's. */
export function withOwnMaskIds(markup: string, owner: string): string {
  return [...markup.matchAll(/<(?:mask|clipPath) id="([^"]+)"/g)].reduce(
    (own, [, id = '']) => own.replaceAll(id, `${id}-${owner}`),
    markup,
  )
}

const style = new Style(faceArt)
const drawn = new Map<string, string>()

/** The picture of a face as markup: drawn once for each seed, spec and drawing, as a mood changes back and forth between the same few. */
export function drawFace(
  seed: string,
  spec: FaceSpec | null | undefined,
  drawing: HumanDrawing,
): string {
  const options = optionsOf(seed, spec, drawing)
  const tokens = tokensOf(spec, seed)
  const key = JSON.stringify([options, tokens])
  const known = drawn.get(key)
  if (known !== undefined) return known
  const markup = withOwnMaskIds(
    withTokens(faceMarkup(new Avatar(style, options).toString()), tokens),
    hashOf(key).toString(36),
  )
  drawn.set(key, markup)
  return markup
}

const markupTag = /<(\/?)([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g
const markupAttribute = /([\w:-]+)="([^"]*)"/g

/** The style of an element as React takes it, an object of properties in camel case, from the declarations of the attribute. */
function styleOf(declarations: string): Record<string, string> {
  return Object.fromEntries(
    declarations
      .split(';')
      .map((declaration) => declaration.split(':').map((part) => part.trim()))
      .filter(([name, value]) => name !== '' && value !== undefined)
      .map(([name = '', value = '']) => [propOf(name), value]),
  )
}

/** The name that React gives an attribute of the markup: `class` is `className`, and a name with a dash is in camel case (`clip-path` is `clipPath`). */
function propOf(name: string): string {
  if (name === 'class') return 'className'
  if (name.startsWith('data-') || name.startsWith('aria-') || name.includes(':')) return name
  return name.replace(/-([a-z])/g, (_dash, letter: string) => letter.toUpperCase())
}

/**
 * The elements that the markup of a face is, made without putting the markup in the page as HTML.
 * The markup holds only the tags that the art draws with (`svg`, `g`, `path`) and their attributes
 * in double quotes, so the parts of it that a reader may not read, such as a script, have nowhere
 * to go: a tag that is not closed, and any text, are left out. The place of the eyes (see
 * `eyesSlotId`) is where `eyes`, if it is given, puts them, with the place that the art gives them.
 */
export function elementsOf(
  markup: string,
  eyes?: (place: string | undefined) => ReactNode,
): ReactNode {
  const roots: ReactNode[] = []
  const open: { tag: string; props: Record<string, unknown>; children: ReactNode[] }[] = []
  const add = (node: ReactNode) => (open.at(-1)?.children ?? roots).push(node)
  let key = 0
  for (const [, closing, tag = '', attributes = '', selfClosing] of markup.matchAll(markupTag)) {
    if (closing === '/') {
      const done = open.pop()
      if (done !== undefined) add(createElement(done.tag, done.props, ...done.children))
      continue
    }
    const props: Record<string, unknown> = { key: String(key++) }
    for (const [, name = '', value = ''] of attributes.matchAll(markupAttribute)) {
      props[propOf(name)] = name === 'style' ? styleOf(value) : value
    }
    if (selfClosing === '/' && props.id === eyesSlotId && eyes !== undefined) {
      const place = props['data-place']
      add(createElement('g', props, eyes(typeof place === 'string' ? place : undefined)))
    } else if (selfClosing === '/') add(createElement(tag, props))
    else open.push({ tag, props, children: [] })
  }
  return roots
}

/** A source of numbers from 0 up to 1 that a text sets going, so that the same text gives the same faces. */
export function randomOf(text: string): () => number {
  let state = hashOf(text) || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The face spec that a value holds, when it is one: the choice of a person's face as the catalog
 * names it. Null for any other value: no face, or a shape that is not one.
 */
export function faceSpecOf(value: unknown): FaceSpec | null {
  if (!isRecord(value) || !isString(value.style)) return null
  const { style, palette } = value
  const { parts, colors } = value
  if (palette !== undefined && !isString(palette)) return null
  if (!isRecord(parts) || !isRecord(colors)) return null
  const partKeys: Record<string, string | null> = {}
  for (const [part, variant] of Object.entries(parts)) {
    if (variant !== null && !isString(variant)) return null
    partKeys[part] = variant
  }
  const colorKeys: Record<string, string> = {}
  for (const [role, token] of Object.entries(colors)) {
    if (!isString(token)) return null
    colorKeys[role] = token
  }
  return {
    style,
    ...(palette === undefined ? {} : { palette }),
    parts: partKeys,
    colors: colorKeys,
  }
}

/** The share of the parts that a face may go without (glasses, a beard, ...) that a random face has. */
const optionalShare = 0.3

function pickFrom<Item>(list: readonly Item[], random: () => number): Item | undefined {
  return list[Math.floor(random() * list.length)]
}

/** The share of the random faces that may wear a lip color that do wear one. */
const lipstickShare = 0.6

/** Whether a face of the kind asked may wear a lip color: one that is not asked for a gender, or that is asked to be feminine. */
function isLipstickAsked(wanted: FaceTags): boolean {
  const genders = wanted.gender ?? []
  return genders.length === 0 || genders.includes('feminine')
}

/**
 * A face at random within what is asked: for every part, a variant that fits the tags (a part that
 * nothing fits is left to the seed; one that a face may go without is had about a third of the
 * time, and the face says so when it has none), a palette of colors that go together and fit the
 * tags (a white-haired face is of an age that has white hair), a lip color that shows on its skin
 * for some faces that may wear one (a lip color of the tags asked: a child has none but a natural
 * pink), and a pastel for the background.
 */
export function randomSpec(wanted: FaceTags, random: () => number): FaceSpec {
  const parts: Record<string, string | null> = {}
  for (const part of faceCatalog.parts) {
    const variant = pickFrom(variantsFitting(part.key, wanted), random)
    if (part.optional && (variant === undefined || random() > optionalShare)) parts[part.key] = null
    else if (variant !== undefined) parts[part.key] = variant.key
  }
  const palette = pickFrom(palettesFitting(wanted), random)
  const lipChoices = (palette?.lips ?? []).filter((token) =>
    isFitting(tokenTagsOf('mouth', token), wanted),
  )
  const lips =
    isLipstickAsked(wanted) && random() < lipstickShare ? pickFrom(lipChoices, random) : undefined
  const background = pickFrom(
    faceCatalog.colors.find(({ role }) => role === 'background')?.tokens ?? [],
    random,
  )
  return {
    style: 'plain',
    ...(palette === undefined ? {} : { palette: palette.key }),
    parts,
    colors: {
      ...(background === undefined ? {} : { background: background.key }),
      ...(lips === undefined ? {} : { mouth: lips }),
    },
  }
}
