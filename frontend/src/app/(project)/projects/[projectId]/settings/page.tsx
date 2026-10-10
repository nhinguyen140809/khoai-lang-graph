import { SettingsIcon } from 'lucide-react'

import { EmptyState } from '@/components/state'

export default function Page() {
  return (
    <EmptyState
      icon={SettingsIcon}
      title="Project settings are not built yet"
      description="The general settings, the run settings and the models of the project come in a later version."
    />
  )
}
