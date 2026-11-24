import type { FaceProps, MotionLook } from '../face.types'

/** The tags of a variant: for each category of tags, the values that fit it. */
export type FaceTags = Readonly<Record<string, readonly string[]>>

/** One drawing of a part of a face, as the catalog names it. */
export interface FaceVariant {
  /** The id of the variant, in words: what the catalog, a face spec and the mood table name. */
  key: string
  /** The id of its drawing in the art. */
  art: string
  title: string
  tags: FaceTags
}

/** A part of a face (hair, eyes, mouth, ...) with every drawing of it. */
export interface FacePart {
  key: string
  style: string
  /** A face may have none of it. */
  optional: boolean
  variants: readonly FaceVariant[]
}

/** The tones that a color role may take, by name: a token has no value, the style sheet holds it. */
export interface FaceColorRole {
  role: string
  /** A face that names no token for the role takes one by its seed, in place of the one of the palette (a background, which a palette does not name). */
  fromSeed?: boolean
  tokens: readonly { key: string; title: string; tags?: FaceTags }[]
}

/** A named pick of one token for every role, that go well together (a skin and the eyes and the hair that it is usually seen with). */
export interface FacePalette {
  key: string
  title: string
  /** The tags that the whole set fits: no token of it fits less. */
  tags: FaceTags
  /** A face that names no palette may take this one by its seed (the natural ones). */
  fromSeed?: boolean
  /** Lip colors that show on the skin of the palette, which a face that may wear a lip color takes one of (its own mouth is a dark tone). */
  lips?: readonly string[]
  tokens: Readonly<Record<string, string>>
}

/** One eye of a family: the variant, how it looks (`open`, `half`, `wide`, `shut`, `smile`), and whether it is drawn upside down (a bowl of a shut eye as the arch of a smile). */
export interface FaceEyeMember {
  variant: string
  kind: string
  isFlipped?: boolean
}

/** Eyes of a size so near that one turns into another without a jolt: a face whose eyes are one of them lets its eyes change among them (an open eye closes, a wide one narrows). Eyes of no family keep the one they have. */
export interface FaceEyeFamily {
  key: string
  title: string
  members: readonly FaceEyeMember[]
}

/** Every part, color and tag of the faces of people, as its catalog lists them. */
export interface FaceCatalog {
  description: string
  styles: readonly { key: string; title: string; package: string; license: string }[]
  tagCategories: readonly { key: string; values: readonly string[] }[]
  parts: readonly FacePart[]
  colors: readonly FaceColorRole[]
  palettes: readonly FacePalette[]
  /** The kinds that an eye of a family may be. */
  eyeKinds: readonly string[]
  eyeFamilies: readonly FaceEyeFamily[]
}

/**
 * The face of a user as the user, or an agent for them, has chosen it: a variant of some of the
 * parts and a token for some of the roles. What it does not name comes from the seed (a part) or
 * from the palette of the plain look (a color).
 */
export interface FaceSpec {
  style: string
  /** The palette that the colors come from, by key: the colors that go together. The seed picks one where there is none. */
  palette?: string
  /** The variant of a part by key; `null` for a part that a face may go without, to say that it has none. */
  parts: Readonly<Record<string, string | null>>
  colors: Readonly<Record<string, string>>
}

/** The frame that a face is drawn in: a circle with the pastel background of the face, or none (the head only, with no background and no clipping). */
export type HumanFrame = 'circle' | 'none'

/** What the face of a person is given: what every face is given, the spec that says what it looks like, and the frame it is drawn in. */
export interface HumanFaceProps extends FaceProps {
  /** The frame of the face; a circle by default. */
  frame?: HumanFrame
  /** What the face looks like, where it is chosen; a part or a color that it does not name comes from the seed. */
  spec?: FaceSpec | null
}

/** The drawing that a mood asks of the face: the variant of the mouth, by key, or none to keep the one of the face. */
export interface HumanDrawing {
  mouth: string | null
}

/** How an eye is asked to look: as the face has it (`rest`), or as a kind of eye of its family. */
export type EyeRole = 'rest' | 'open' | 'half' | 'wide' | 'shut' | 'smile'

/** What an eye is asked to look like, and for how long, in milliseconds. */
export interface EyeStep {
  role: EyeRole
  ms: number
  /** The eye looks up or down in its lid for the step: the iris moves there, the eye stays. */
  look?: EyeLook
}

/** Which way an eye looks in its lid for a step, besides where the gaze of the face takes it. */
export type EyeLook = 'up' | 'down'

/** What a mood asks of each eye: a round of steps, which comes round again after the last. The eyes of a face go each its own way. */
export interface HumanEyesLook {
  left: readonly EyeStep[]
  right: readonly EyeStep[]
}

/** An eye as it is drawn: the variant of the art, and whether it is upside down. */
export interface EyeShape {
  variant: string
  isFlipped: boolean
  /** The way it looks in its lid; none when it looks as the gaze does. It does not make another drawing. */
  look: EyeLook | null
}

/** What is asked of one drawing of an eye (see `eyeLayerMarkup`). */
export interface EyeLayerOptions {
  /** The drawing is upside down. */
  isFlipped: boolean
  /** The drawing has its iris: not where the iris of another eye stays in its place while the lids change. */
  hasIris: boolean
  /** Where the iris settles into its place, the middle that it grows and moves about, when it comes from another eye. */
  settleAt?: { x: number; y: number }
}

/** What a mood does to the face of a person: how it moves, what the eyes go through, and what the mouth is drawn as. */
export interface HumanMoodLook extends MotionLook, HumanDrawing {
  eyes: HumanEyesLook
  /** The eyes are shut for the whole of the mood, such as in sleep, so that they do not blink; open when it is not given. */
  isEyesShut?: boolean
}

/** Where an iris is and how large: the middle, and the side of a square of the same area. */
export interface IrisSpot {
  x: number
  y: number
  size: number
}

/** One drawing of a pair of eyes: the shapes of the white of the eye, the gleam in the iris, the iris and the lid, as paths of the eye part of the art, or nothing for a shape that the eyes do not have. */
export interface HumanEyeArt {
  /** Where the iris of each eye is, as the middle and the size (the side of a square of its area), in the units of the eye part; none for an eye that has no iris. */
  spots: { left: IrisSpot | null; right: IrisSpot | null }
  white: string
  shine: string
  /** The shape that cuts the iris where it moves over the white of the eye, or nothing for an eye with no white. */
  socket: string
  iris: string
  lid: string
}
