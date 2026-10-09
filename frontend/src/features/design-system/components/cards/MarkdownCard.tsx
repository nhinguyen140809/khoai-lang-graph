import { Markdown } from '@/components/ui/markdown'

import { sampleMarkdown } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

export function MarkdownCard() {
  return (
    <SampleCard
      title="Markdown"
      description="Streamdown; code blocks in Night Owl Light and Night Owl."
    >
      <Markdown>{sampleMarkdown}</Markdown>
    </SampleCard>
  )
}
