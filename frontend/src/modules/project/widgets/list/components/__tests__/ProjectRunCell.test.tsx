import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectRunCell } from '../ProjectRunCell'
import { runCellCases } from './ProjectRunCell.data'

describe('ProjectRunCell', () => {
  it.each(runCellCases)('says $text for the status $status', ({ status, text }) => {
    const { container } = render(<ProjectRunCell project={{ rollup_run_status: status }} />)

    expect(container).toHaveTextContent(text)
  })
})
