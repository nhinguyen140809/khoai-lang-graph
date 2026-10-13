import { usePathname } from 'next/navigation'
import { useEffect, useEffectEvent } from 'react'

import type { Activity } from '../activities/activity.types'
import { activityOfHref, isFeatureActivity } from '../activities/activity.utils'
import { useSideFeatureStore } from '../activities/side-feature.store'
import { usePanelsStore } from '../panels/panels.store'
import { useEditorTabsStore } from '../tabs/editor-tabs.store'

/**
 * Reads what the frame keeps in the browser after the first render, so that the server HTML and
 * the first client render use the defaults: the panels, the side feature and the tabs. When no
 * feature was chosen yet, the feature shown then becomes the chosen one, so that its side panel
 * stays until the user chooses another, instead of following the pages opened.
 *
 * @param activities The features of the screen, as Workbench gets them.
 */
export function useRestoreFrame(activities: readonly Activity[]) {
  const pathname = usePathname()

  const keepSideFeature = useEffectEvent(() => {
    const { chosen, choose } = useSideFeatureStore.getState()
    if (chosen !== null) return
    const features = activities.filter(isFeatureActivity)
    const shown = activityOfHref(features, pathname) ?? features[0]
    if (shown !== undefined) choose(shown.id)
  })

  useEffect(() => {
    void Promise.all([
      usePanelsStore.persist.rehydrate(),
      useSideFeatureStore.persist.rehydrate(),
      useEditorTabsStore.persist.rehydrate(),
    ]).then(() => {
      keepSideFeature()
    })
  }, [])
}
