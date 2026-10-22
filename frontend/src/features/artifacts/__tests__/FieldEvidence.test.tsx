import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EvidenceField, GroupField, isEvidenceList, isGroupList } from '../components/FieldEvidence'

describe('isEvidenceList / isGroupList shape guards', () => {
  it('accepts the persona evidence entries and rejects near misses', () => {
    const evidence = [
      { observation: 'OBS-001', source: 'SRC-001', quote: '61% said they would stop.' },
    ]
    expect(isEvidenceList(evidence)).toBe(true)
    expect(isEvidenceList([])).toBe(false)
    expect(isEvidenceList([observation()])).toBe(false)
    expect(isEvidenceList('OBS-001')).toBe(false)

    function observation() {
      return { observation: 'OBS-001', source: 'SRC-001' } // no quote: not evidence
    }
  })

  it('accepts the catalog stakeholder groups and rejects near misses', () => {
    const groups = [
      {
        name: 'Students',
        description: 'Undergraduates seeking guidance.',
        observations: ['OBS-001', 'OBS-002'],
      },
    ]
    expect(isGroupList(groups)).toBe(true)
    expect(isGroupList([{ name: 'Students', description: 'x', observations: [3] }])).toBe(false)
    expect(isGroupList(null)).toBe(false)
  })
})

describe('EvidenceField', () => {
  it('draws the observation-to-source chain and the verbatim quote', () => {
    const entries = [
      {
        observation: 'OBS-001',
        source: 'SRC-001',
        quote:
          '61% said they would stop using a tool that needs more than a few taps to book a chat.',
      },
      {
        observation: 'OBS-002',
        source: 'SRC-001',
        quote: "I don't want my career questions visible to everyone.",
      },
    ]
    const { container } = render(<EvidenceField entries={entries} />)
    expect(container.textContent).toContain('OBS-001 → SRC-001')
    expect(container.textContent).toContain('OBS-002 → SRC-001')
    expect(container.textContent).toContain(
      '61% said they would stop using a tool that needs more than a few taps to book a chat.',
    )
    expect(container.textContent).toContain("I don't want my career questions visible to everyone.")
  })
})

describe('GroupField', () => {
  it('draws one titled block per group with its observation keys', () => {
    const entries = [
      {
        name: 'Students',
        description: 'Undergraduates seeking guidance.',
        observations: ['OBS-001', 'OBS-002'],
      },
    ]
    const { container } = render(<GroupField entries={entries} />)
    expect(container.textContent).toContain('Students')
    expect(container.textContent).toContain('Undergraduates seeking guidance.')
    expect(container.textContent).toContain('OBS-001 · OBS-002')
  })
})
