import type { CardEntry } from '../../design-system.types'
import { buttonsCardEntry } from './actions/ButtonsCard'
import { commandCardEntry } from './actions/CommandCard'
import { controlsCardEntry } from './actions/ControlsCard'
import { actCatalogCardEntry } from './agents/ActCatalogCard'
import { actMoodsCardEntry } from './agents/ActMoodsCard'
import { actsCardEntry } from './agents/ActsCard'
import { faceCardEntry } from './agents/FaceCard'
import { faceEyesCardEntry } from './agents/FaceEyesCard'
import { faceLooksCardEntry } from './agents/FaceLooksCard'
import { faceMoodsCardEntry } from './agents/FaceMoodsCard'
import { faceMotionsCardEntry } from './agents/FaceMotionsCard'
import { feedEntryCardEntry } from './agents/FeedEntryCard'
import { traceCardEntry } from './agents/TraceCard'
import { chatCardEntry } from './chat/ChatCard'
import { itemsCardEntry } from './chat/ItemsCard'
import { reviewCardEntry } from './chat/ReviewCard'
import { codeCardEntry } from './content/CodeCard'
import { diffViewCardEntry } from './content/DiffViewCard'
import { floatingSurfaceCardEntry } from './content/FloatingSurfaceCard'
import { highlightCardEntry } from './content/HighlightCard'
import { markdownCardEntry } from './content/MarkdownCard'
import { stepperCardEntry } from './content/StepperCard'
import { timelineCardEntry } from './content/TimelineCard'
import { artifactTableCardEntry } from './data/ArtifactTableCard'
import { chartCardEntry } from './data/ChartCard'
import { graphCardEntry } from './data/GraphCard'
import { alertsCardEntry } from './feedback/AlertsCard'
import { badgesCardEntry } from './feedback/BadgesCard'
import { calendarCardEntry } from './forms/CalendarCard'
import { formCardEntry } from './forms/FormCard'
import { tokensCardEntry } from './foundations/TokensCard'
import { typographyCardEntry } from './foundations/TypographyCard'
import { humanFaceCardEntry } from './identity/HumanFaceCard'
import { iconsCardEntry } from './identity/IconsCard'
import { thumbnailsCardEntry } from './identity/ThumbnailsCard'
import { copyButtonCardEntry } from './inputs/CopyButtonCard'
import { numbersCardEntry } from './inputs/NumbersCard'
import { carouselCardEntry } from './layers/CarouselCard'
import { disclosureCardEntry } from './layers/DisclosureCard'
import { overlaysCardEntry } from './layers/OverlaysCard'
import { actCoursesCardEntry } from './motion/ActCoursesCard'
import { actEntrancesCardEntry } from './motion/ActEntrancesCard'
import { actPlacementCardEntry } from './motion/ActPlacementCard'
import { animationCardEntry } from './motion/AnimationCard'
import { glowCardEntry } from './motion/GlowCard'
import { lightCardEntry } from './motion/LightCard'
import { loadingLayoutsCardEntry } from './motion/LoadingLayoutsCard'
import { ringsCardEntry } from './motion/RingsCard'
import { skeletonCardEntry } from './motion/SkeletonCard'
import { stageCardEntry } from './motion/StageCard'
import { explorerTreeCardEntry } from './navigation/ExplorerTreeCard'
import { navigationCardEntry } from './navigation/NavigationCard'
import { workspaceCardEntry } from './workspace/WorkspaceCard'

/** Every card of the page, in reading order. A tab shows the cards that name it. */
export const cards: readonly CardEntry[] = [
  tokensCardEntry,
  typographyCardEntry,
  buttonsCardEntry,
  controlsCardEntry,
  commandCardEntry,
  formCardEntry,
  calendarCardEntry,
  alertsCardEntry,
  badgesCardEntry,
  overlaysCardEntry,
  disclosureCardEntry,
  carouselCardEntry,
  navigationCardEntry,
  explorerTreeCardEntry,
  artifactTableCardEntry,
  chartCardEntry,
  graphCardEntry,
  animationCardEntry,
  lightCardEntry,
  glowCardEntry,
  ringsCardEntry,
  stageCardEntry,
  skeletonCardEntry,
  loadingLayoutsCardEntry,
  actEntrancesCardEntry,
  actCoursesCardEntry,
  actPlacementCardEntry,
  traceCardEntry,
  feedEntryCardEntry,
  faceCardEntry,
  faceLooksCardEntry,
  faceMoodsCardEntry,
  faceMotionsCardEntry,
  faceEyesCardEntry,
  actsCardEntry,
  actMoodsCardEntry,
  actCatalogCardEntry,
  humanFaceCardEntry,
  thumbnailsCardEntry,
  iconsCardEntry,
  numbersCardEntry,
  copyButtonCardEntry,
  markdownCardEntry,
  codeCardEntry,
  highlightCardEntry,
  diffViewCardEntry,
  timelineCardEntry,
  stepperCardEntry,
  floatingSurfaceCardEntry,
  chatCardEntry,
  reviewCardEntry,
  itemsCardEntry,
  workspaceCardEntry,
]
