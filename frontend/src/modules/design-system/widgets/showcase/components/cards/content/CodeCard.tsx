import { Code, type CodeSize, type CodeVariant } from '@/shared/components/ui/code'
import { tones } from '@/shared/lib/tone'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

const codeVariants = [
  'solid',
  'surface',
  'soft',
  'outline',
  'plain',
] as const satisfies readonly CodeVariant[]

// Each size in a sentence of the text size it matches.
const codeSizes = [
  { size: 'sm', text: 'text-4xs' },
  { size: 'default', text: 'text-xs' },
  { size: 'lg', text: 'text-sm' },
] as const satisfies readonly { size: CodeSize; text: string }[]

export function CodeCard() {
  return (
    <SampleCard
      title="Code"
      description={
        <>
          Inline code. <Code>variant</Code> is the fill, <Code>color</Code> the meaning, and each{' '}
          <Code>size</Code> matches a text size.
        </>
      }
      className="flex flex-col gap-3"
    >
      {codeVariants.map((variant) => (
        <SampleGroup key={variant} label={variant}>
          <div className="flex flex-wrap gap-1.5">
            {tones.map((color) => (
              <Code key={color} variant={variant} color={color}>
                {color}
              </Code>
            ))}
          </div>
        </SampleGroup>
      ))}
      <SampleGroup label="sizes">
        {codeSizes.map(({ size, text }) => (
          <div key={size} className="flex items-baseline gap-2">
            <SampleLabel className="w-12 shrink-0">{size}</SampleLabel>
            <p className={text}>
              Trace <Code size={size}>REQ-001</Code> back to its personas.
            </p>
          </div>
        ))}
      </SampleGroup>
    </SampleCard>
  )
}
