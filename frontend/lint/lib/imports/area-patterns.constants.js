// The areas of src/app/, one for each view. A area places the frame of its view and the slices
// that frame shows; the slices that only the frame of the other view places stay out of it.

const userAreaMessage =
  'The pages of the user view place the desk: the workbench and the slices that only it shows belong to the pages of the developer view (CONTRIBUTING: Areas of the app).'

const developerAreaMessage =
  'The pages of the developer view place the workbench: the desk and the slices that only it shows belong to the pages of the user view (CONTRIBUTING: Areas of the app).'

/**
 * What the index of `@/shared/components/frame` gives for the desk: the desk, the items of its bar
 * and the parts of its side list. Its other names are the workbench. A name added to the desk is
 * added here too, or the pages of the user view cannot import it.
 */
const deskNames = [
  'Desk',
  'DeskBarItem',
  'DeskBarSide',
  'useDeskBarItem',
  'useSidebarLayout',
  'SidebarLayout',
  'SidebarActionItem',
  'SidebarItemMenu',
  'SidebarLinkItem',
  'SidebarNote',
  'SidebarRetryItem',
  'SidebarSearch',
  'SidebarSection',
  'SidebarSectionAction',
]

/** What the pages of the user view, in `src/app/user/`, may not import. */
export const userAreaPatterns = [
  {
    group: ['@/shared/components/frame'],
    allowImportNames: deskNames,
    message: userAreaMessage,
  },
  {
    group: [
      '@/modules/traceability',
      '@/modules/traceability/**',
      '@/modules/documents/widgets/panel',
      '@/modules/documents/widgets/document',
      '@/modules/documents/widgets/item',
      '@/modules/activity/widgets/panel',
      '@/modules/activity/widgets/tab',
      '@/modules/project/widgets/list',
      '@/modules/project/widgets/menu',
      '@/modules/project/widgets/status',
    ],
    message: userAreaMessage,
  },
]

/** What the pages of the developer view, in `src/app/developer/`, may not import. */
export const developerAreaPatterns = [
  {
    group: ['@/shared/components/frame'],
    importNames: deskNames,
    message: developerAreaMessage,
  },
  {
    group: ['@/modules/project/entities'],
    importNames: ['DeskProjectPagesProvider'],
    message: developerAreaMessage,
  },
  {
    group: [
      '@/modules/project/widgets/sidebar',
      '@/modules/project/widgets/heading',
      '@/modules/project/widgets/recents',
      '@/modules/documents/widgets/reader',
    ],
    message: developerAreaMessage,
  },
]

/**
 * The rule that maps a host to its view and an address to its area is read by `src/proxy.ts` and
 * the route helper of `src/shared/routes/typed-route` only; every other part takes the view from
 * the area it sits in.
 */
export const viewAreaPattern = {
  group: ['@/shared/routes/hosts', '@/shared/routes/hosts/**'],
  message:
    'Only the proxy and the route helper read the host of a request and the areas of the views: read the view with useView of @/shared/lib/view (CONTRIBUTING: Areas of the app).',
}
