import { takeShots, visit } from './screenshot.utils'

takeShots('Design system', [
  { name: 'Components in both themes', steps: visit('/design-system'), fullPage: true },
])
