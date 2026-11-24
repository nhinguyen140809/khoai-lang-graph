import {
  faceCatalog,
  type FaceEyeFamily,
  type FacePart,
  type FaceTags,
  HumanFace,
  moods,
} from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { SampleCard, SampleGroup, SampleLabel } from '../../Sample'

/** The tags of a variant or a token as lines: one for each kind of tag. */
function TagNotes({ tags }: { tags?: FaceTags | undefined }) {
  const lines = Object.entries(tags ?? {})
  if (lines.length === 0) return <span className="text-muted-foreground">fits every tag</span>
  return (
    <>
      {lines.map(([category, values]) => (
        <span key={category} className="block text-muted-foreground">
          {category}: {values.join(', ')}
        </span>
      ))}
    </>
  )
}

/** One part with every variant of it, drawn on the same person, with its semantic key, the id of its art and its tags. */
function HumanFacePart({ part }: { part: FacePart }) {
  return (
    <SampleCard
      title={`Human face: ${part.key}`}
      description={`${String(part.variants.length)} variants of the ${part.key}${part.optional ? ', which a face may go without' : ''}, each drawn on the same person.`}
    >
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-6">
        {part.variants.map((variant) => (
          <div key={variant.key} className="flex flex-col items-start gap-2">
            <HumanFace
              seed="fay"
              size="2xl"
              spec={{ style: 'plain', parts: { [part.key]: variant.key }, colors: {} }}
            />
            <div className="flex flex-col text-xs">
              <SampleLabel>{variant.key}</SampleLabel>
              <span className="text-muted-foreground">{variant.art}</span>
              <TagNotes tags={variant.tags} />
            </div>
          </div>
        ))}
      </div>
    </SampleCard>
  )
}

/** A card for each part of the catalog. */
const humanFacePartCardEntries: CardEntry[] = faceCatalog.parts.map((part) => ({
  id: `human-face-${part.key}`,
  label: `Human face: ${part.key}`,
  section: 'identity',
  span: 12,
  keywords: `face human ${part.key} variants tags`,
  View: () => <HumanFacePart part={part} />,
}))

/** Every token of every color role as a swatch of its custom property, with its key and tags. */
function HumanFaceTokens() {
  return (
    <SampleCard
      title="Human face: color tokens"
      description="Every token of every color role, as a swatch of its custom property, with its tags."
      className="flex flex-col gap-10"
    >
      {faceCatalog.colors.map(({ role, tokens, fromSeed }) => (
        <SampleGroup
          key={role}
          label={`Color ${role}: ${String(tokens.length)} tokens${fromSeed === true ? ', by the seed' : ''}`}
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 @xl:grid-cols-4 @3xl:grid-cols-6 @5xl:grid-cols-8">
            {tokens.map(({ key, tags }) => (
              <div key={key} className="flex flex-col items-start gap-2">
                <div
                  className="size-10 rounded-full border"
                  style={{ backgroundColor: `var(--human-face-${role}-${key})` }}
                />
                <div className="flex flex-col text-xs">
                  <SampleLabel>{key}</SampleLabel>
                  <span className="text-muted-foreground">
                    --human-face-{role}-{key}
                  </span>
                  <TagNotes tags={tags} />
                </div>
              </div>
            ))}
          </div>
        </SampleGroup>
      ))}
    </SampleCard>
  )
}

/** Every palette: the tokens that go together, and the lip colors that show on its skin. */
function HumanFacePalettes() {
  return (
    <SampleCard
      title="Human face: palettes"
      description={`${String(faceCatalog.palettes.length)} sets of colors that go together: the token of each role, and the lip colors that show on the skin.`}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 @xl:grid-cols-2 @3xl:grid-cols-3">
        {faceCatalog.palettes.map((palette) => (
          <div key={palette.key} className="flex items-start gap-3">
            <HumanFace
              seed="fay"
              size="xl"
              spec={{ style: 'plain', palette: palette.key, parts: {}, colors: {} }}
            />
            <div className="flex flex-col text-xs">
              <SampleLabel>{palette.key}</SampleLabel>
              <TagNotes tags={palette.tags} />
              {Object.entries(palette.tokens).map(([role, token]) => (
                <span key={role}>
                  <span className="text-muted-foreground">{role} </span>
                  {token}
                </span>
              ))}
              {palette.lips !== undefined && (
                <span>
                  <span className="text-muted-foreground">lips </span>
                  {palette.lips.join(', ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SampleCard>
  )
}

/** The eyes of a face are of a family when they are near in size: each family with its eyes by kind, and then the one face of it going through every mood, so that the eyes change among the family. */
function HumanFaceEyeFamilies() {
  return (
    <SampleCard
      title="Human face: eye families"
      description="Eyes of a size so near that one fades into another. A mood asks the eyes of a face for a round of kinds (open, half, wide, shut, smile), and each eye takes an eye of that kind from the family of the eyes of the face; an eye of no family keeps its own. Each family is shown by kind, and then in every mood with the first of its open eyes."
      className="flex flex-col gap-10"
    >
      {faceCatalog.eyeFamilies.map((family) => (
        <EyeFamily key={family.key} family={family} />
      ))}
    </SampleCard>
  )
}

function EyeFamily({ family }: { family: FaceEyeFamily }) {
  const first = family.members.find(({ kind }) => kind === 'open')?.variant ?? ''
  const spec = { style: 'plain', parts: { eyes: first }, colors: {} }
  return (
    <SampleGroup label={`Family ${family.key}: ${String(family.members.length)} eyes`}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 @xl:grid-cols-4 @3xl:grid-cols-6 @5xl:grid-cols-8">
        {family.members.map((member) => (
          <div key={`${member.variant}-${member.kind}`} className="flex flex-col items-start gap-2">
            <HumanFace
              seed="fay"
              size="xl"
              spec={{ style: 'plain', parts: { eyes: member.variant }, colors: {} }}
            />
            <div className="flex flex-col text-xs">
              <SampleLabel>{member.variant}</SampleLabel>
              <span className="text-muted-foreground">
                {member.kind}
                {member.isFlipped === true ? ', upside down' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 @xl:grid-cols-4 @3xl:grid-cols-8">
        {moods.map((mood) => (
          <div key={mood} className="flex flex-col items-start gap-2">
            <HumanFace seed="fay" size="xl" spec={spec} mood={mood} />
            <SampleLabel>{mood}</SampleLabel>
          </div>
        ))}
      </div>
    </SampleGroup>
  )
}

/** The cards of the catalog of the faces of people: a card for each part, and one for the tokens and one for the palettes. */
export const humanFaceCatalogCardEntries: CardEntry[] = [
  ...humanFacePartCardEntries,
  {
    id: 'human-face-eye-families',
    label: 'Human face: eye families',
    section: 'identity',
    span: 12,
    keywords: 'face human eyes families kinds fade mood',
    View: HumanFaceEyeFamilies,
  },
  {
    id: 'human-face-tokens',
    label: 'Human face: color tokens',
    section: 'identity',
    span: 12,
    keywords: 'face human color tokens semantic roles',
    View: HumanFaceTokens,
  },
  {
    id: 'human-face-palettes',
    label: 'Human face: palettes',
    section: 'identity',
    span: 12,
    keywords: 'face human palettes colors skin hair eyes',
    View: HumanFacePalettes,
  },
]
