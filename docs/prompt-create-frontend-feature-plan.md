# Prompt: create a frontend feature or widget plan

Write a plan for a frontend PR that builds features, widgets, or both: an action of the user (stop a run, rename a project, send a message), a block of the screens (the status of a project, the list of projects), or a screen made of them. The prompt holds for every module and for a PR that spans several modules; it names no module of its own. For a PR that only adds the entities of a module, use [Prompt: create a frontend entity plan](prompt-create-frontend-entity-plan.md) instead.

The plan is a single markdown file in `docs/`, named `frontend-<id>-<name>-plan.md`, with the id of its row in the PR table of the [Frontend implementation plan](frontend-implementation-plan.md) (for example `frontend-p7-project-status-plan.md`). An agent implements from it, so it must be prescriptive: every decision is made and written down, the agent only applies it.

## Contents

- [Prerequisites](#prerequisites)
- [Docs-first rule](#docs-first-rule)
- [Sources to read before writing](#sources-to-read-before-writing)
- [Placement across modules](#placement-across-modules)
- [Folders inside a feature or a widget](#folders-inside-a-feature-or-a-widget)
- [Naming](#naming)
- [State: where it lives and how it is named](#state-where-it-lives-and-how-it-is-named)
- [Labels, looks and classes of a value](#labels-looks-and-classes-of-a-value)
- [Screen states and accessibility](#screen-states-and-accessibility)
- [What to write in the plan](#what-to-write-in-the-plan)
- [Rules to follow while writing](#rules-to-follow-while-writing)

## Prerequisites

Load these two skills before starting. Both are committed in this repo under `docs/skills/`:

1. **Feature-Sliced Design** (`docs/skills/feature-sliced-design/SKILL.md`): the layers, the import rule, the extraction rule ("start simple, extract when needed"), and the strategies for two slices of one layer that need each other (merge, push down to the entity, compose from the layer above, public API). Read `references/cross-import-patterns.md` and `references/layer-structure.md` of the skill too: a feature or widget plan always decides where a block goes and how two slices meet.
2. **Clean Review** (`docs/skills/clean-review/SKILL.md`): the 7-dimension quality check (naming, functions, DRY, YAGNI, magic numbers, readability, conventions), plus SOLID. Run it on the files that the plan copies from a backup branch before deciding what changes in each copy.

Read both files before writing the plan. If your tool supports skills (Claude Code, ZCode), you can also install them to `~/.claude/skills/`, but reading the files in this repo is enough.

## Docs-first rule

If the plan needs something that the docs do not describe, or that they get wrong, do NOT write code that invents behavior:

1. An endpoint, a field, a status code or a rule of the API (`docs/API.md`, `docs/DATA_SHAPE.md`): propose the fix on the `docs/fe/api-fields` branch, or tell the user to add it there.
2. What a screen shows or how it behaves (`docs/ui/usability.md`, `docs/ui/skeletons.md`, `docs/architecture/web-app.md`): ask the user, and write the answer in that doc in a `docs` commit of the PR, before the code.
3. A placement or naming rule (`docs/architecture/web-app-modules.md`, `frontend/CONTRIBUTING.md`): the change goes in a `docs` commit, and a rule that ESLint checks changes in `frontend/lint/` in a `build` commit, both before the code that follows the new rule. A change that moves existing files to a new rule is a refactor PR of its own, before this one, except a move that only the new files of this PR call for (an entity that gets a second topic): that move is the `refactor` commit right after the `build` commit of this PR.
   - A placement mistake that a selector can catch (a `*.utils.ts` that imports TanStack Query) gets an ESLint check in the same `build` commit, so that the next PR cannot make it again. A later config block replaces the whole `no-restricted-syntax` or `no-restricted-imports` rule of an earlier one, so a new check is a new group of `lint/lib/syntax/syntax-groups.constants.js`, added to each block of files that it covers, with a case in `lint/configs/__tests__/configs.test.js`.
   - A lint test that takes a module as the example of a rule (a module without topics) changes its example when the PR changes that module.
4. The plan notes every gap in its "Left for the next PRs" section, with where it is tracked.

No code and no mock answers an endpoint that the API does not describe, and no screen shows a state that the UI docs do not describe.

## Sources to read before writing

Read these in order. Each gives a different layer of context.

### 1. Concept, screen and architecture docs

| File | What it gives |
|---|---|
| `docs/ui/usability.md` | What the user sees and does, in user words; the decisions D0 to D6 that every screen meets; the developer view and the user view |
| `docs/ui/skeletons.md` | The frame and the regions of each screen |
| `docs/architecture/web-app.md` | How the screens read the data; section 9 lists the files of each part |
| `docs/architecture/web-app-modules.md` | Section 2 (what an entity, a feature and a widget hold), section 3 (kinds of file), section 5 (imports and `@x`), section 9 (blocks that read several modules) |
| `docs/API.md`, `docs/DATA_SHAPE.md` | The endpoints that the actions call, their status codes and errors; the fields that the blocks show |
| `frontend/CONTRIBUTING.md` | Inside a slice, hooks of a slice, files of a slice, dialogs opened from several places, destructive actions, toasts, the shared code table |
| `frontend/README.md`, `frontend/src/mocks/README.md` | The mock scenarios of the page URL, the screenshot tests |

### 2. The entities the slices read

For each module that the slices read, open `src/modules/<module>/entities/index.ts` and its `@x/` files, and list what the plan uses: query hooks, keys, types, looks and labels, pure rules. Anything missing is either added by this PR to the entity that owns it (section 7 of the plan, as a commit before the slices) or waits for the entity PR of its module; the plan says which.

### 3. Shared code and the frame

Grep these exports before writing anything new. The plan reuses them by name in its "Shared code first" section.

| What | Path | Use it for |
|---|---|---|
| Status bar | `useStatusBarItem`, `StatusBarSide` of `@/shared/components/frame` | A block that shows in the status bar while its component is mounted |
| Activity bar | `useActivityBarItem`, `ActivityBarItem`, `FeatureDestination` of `@/shared/components/frame`; the `*.config.tsx` files of the features | A feature with an item on the activity bar and a side panel |
| Command palette | `useCommands`, `PaletteCommand`, `PaletteGroup` of `@/shared/components/frame` | The commands of a block, registered while it is mounted |
| Tabs and pages | `useEditorTab`, `useOpenPage` of `@/shared/components/frame` | A page that opens in a tab |
| Mount points | `contributions` of `Workbench`, in the layouts of `src/app/` | Where a layout mounts the widgets that register items, commands and dialogs |
| Registry | `createRegistryStore`, `useRegisterItem`, `useRegisteredItems`, `OrderedItem` of `@/shared/lib/registry` | A new place where components register items; the status bar and the activity bar are built on it |
| Pending action | `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` of `@/shared/lib/pending-action` | A dialog that acts on one thing and opens from several places |
| Dialogs and buttons | `ConfirmDialog` (`shared/components/ui/confirm-dialog.tsx`), `PendingButton`, `Dialog` | Every destructive action asks with `ConfirmDialog` |
| Forms | `Form`, `TextField`, `FormField`, `NumberField` of `@/shared/components/form` | A form with a schema file |
| States of a block | `LoadingState`, `ErrorState`, `EmptyState`, `NotFoundState` of `@/shared/components/state` | The loading, error and empty states of a page or a panel |
| Tones | `Tone`, `toneClasses` of `@/shared/lib/tone`; the `color` and `variant` props of `Badge`, `Button`, `Alert`, `Progress`, `Spinner` | The color of a state |
| Views | `useView`, `Wording`, `useWording(wording)` of `@/shared/lib/view` | A word that differs between the developer view and the user view |
| Errors and toasts | `errorMessageOf` of `@/shared/api/error`; `toast` of `sonner`; `actionToastDuration` of `@/shared/lib/timing` | What follows a mutation |
| Routes | `routes` of `@/shared/routes` | Every link and every navigation |
| Other helpers | `shared/lib/`: `timing` (`debounce`, `sleep`, `useNow`, `coalescedTask` for a task whose calls during a run share one more run after it), `storage`, `hotkey`, `viewport`, `hydration`, `formatters`, `guards`, `collections` | Before writing a helper, check that none of them does it |
| Test suites | `@/test/suites`: `itAsksBeforeAction`, `itShowsQueryStates`, `itToastsOnResult`, `itAsksForFieldsBeforeSending`, and the query hook, query key and request suites | The cases that every action and every block has |
| Test steps | `@/test/steps`: `findConfirmDialog`, `confirmAction`, `cancelAction`, `pressButton`, `expectText`, `expectNoAccessibilityViolations`, `statusBar()`, `openCommandPalette()`, ... | The steps of a test with a flow of its own |
| Rendering | `renderWithProviders`, `renderHookWithProviders` and `TestProviders` of `@/test/render`; `renderWorkbench(contributions)` with `rerenderContributions` | A component or a hook with the query client, the view and the frame; a slice that contributes a status bar item, commands or dialogs, read where the frame shows them |
| Streams and waits in tests | `EventSourceStub`, `resetEventSources` of `@/test/event-source` (set up in `vitest.setup.ts`); `sleep(ms)` of `@/shared/lib/timing`, never `new Promise(setTimeout)` | A hook that follows an event stream; a test that waits for a time |
| Mock scenarios | `answerScenario`, `mockScenario`, `mockRunStatus` of `src/mocks/shared/scenario/` | The URL parameters that show each state in `pnpm dev:mock` and in the screenshots |

Also read one existing slice of each kind that the plan builds, and copy its shape: `project/features/rename` (a dialog opened from several places), `project/features/delete` (a destructive action), `project/widgets/dialogs` (the dialogs mounted once), `project/widgets/commands` (commands in the palette), `project/widgets/list` (a block with filters).

### 4. Backup branches and plan templates

| Source | What to take |
|---|---|
| `docs/frontend-implementation-plan.md` | The row of the PR, what it needs, the table of D8 (which part of a backup goes to which PR), the "As built" notes of the PRs before it |
| `docs/frontend-p7-project-status-plan.md` (a widget and a feature over three modules), `docs/frontend-e6-thread-plan.md`, `docs/frontend-e5-review-plan.md` | The tone and the level of detail of a plan: tables, sketches with JSDoc, commits, checks |
| `origin/feat/fe/artifacts-backup` (P7 and the parts of D8), `origin/feat/fe/mock` | Read a file with `git show <ref>:frontend/src/<path>`. List exactly what changes in each copy: names renamed since (keys, hooks, file paths), the shared helpers that replace local code, the store pattern of CONTRIBUTING, and what is dropped |
| Shared helpers on `main` not used yet (#47) | Built ahead of the screens: `groupBy` (`shared/lib/collections`), `rangesOfQuery` and `splitByRanges` (`shared/lib/text`), `jsonToPlainText` (`shared/lib/formatters`), `wordDiff` (`shared/lib/diff`), `useClipboard` (`shared/lib/clipboard`), and the UI components `Highlight`, `CopyButton`, `FloatingSurface`, `KeyText`, `RelativeTime`, `DiffView` (`shared/components/ui/`), each shown on the design system page. A plan uses them before writing its own |
| Other open branches of helpers | `git branch -r` and the open PRs; list `git diff --stat origin/main...<branch>` again before writing, since such a branch grows, and follow section 5 |

### 5. Helpers waiting on a branch

Before writing a helper, check the branches of section 4 that hold helpers not merged yet. For each helper of such a branch that the plan uses:

1. **The plan uses it directly, by its name and its path**, as if it were on `main`; it writes no copy of its own and no other helper for the same job.
2. **Several helpers of the branch, or the branch ready to merge:** the PR needs the PR of that branch, which merges first. The plan names it in its "Needs", and the row of the branch goes before the row of the plan in the implementation plan. This is the default, since these branches hold the parts of the features and the widgets.
3. **One small helper, and a branch far from ready:** the PR picks the commit of that helper with `git cherry-pick`, unchanged, as its first commit; the branch drops it when it rebases on `main`. The plan names the commit.
4. **Conflicts:** the plan lists the files that both its PR and the branch add or change (an `index.ts`, a `*.utils.ts` of one name, the shared code table of CONTRIBUTING), and says which PR resolves them, the one that merges second.
5. A helper of the branch that does not fit as it is gets its change in the PR of the branch, not in the plan.

## Placement across modules

Decide placement in this order, and write each answer in the "Decisions" section with its reason.

1. **Object or action.** A reading rule of an object (which thread needs the user most, whether a status names a stage, the label and the look of a value) goes to the entity of that object, even when one block reads it today: a widget adds no rule of its own (Web App Modules, section 2). An action that changes something (the mutation, its dialog or form, its rule, such as which run Stop stops) is a feature. A block that puts objects next to actions, or several actions together, is a widget. A block with neither object nor action is shared code.
2. **Which module.** A feature sits in the module of the object it changes (Stop is `run/features/stop`). A widget sits in the highest module that it reads, or in a module of its own above them when it is a subject of the product, as `activity` is (section 9 of Web App Modules). Check that `moduleImports` of `frontend/lint/lib/modules/module-imports.constants.js` lets that module read every module the slice needs; a new module gets its place there in a `build` commit first.
3. **How two slices meet.** A feature never imports another feature, and a widget never imports another widget. When two actions meet in one block, the widget imports both and connects them by props, for example by giving the run on screen to Stop (FSD strategy C, composition from the layer above). When an entity needs another entity, it goes through `@x/<module>.ts` of the entity it reads, which exports only what it reads. A feature that has to refresh queries of modules above its own cannot name their keys: it invalidates a wider key that it may import, and the plan says why.
4. **Where it mounts.** A widget that registers items, commands or dialogs is mounted by a layout of `src/app/`, in the `contributions` of `Workbench`, once per layout. A dialog that several places open is mounted once there too, and the places open it through the store of its feature (CONTRIBUTING: Dialogs opened from several places). A dialog that one place opens stays beside its trigger, with its own state.
5. **What is extracted to shared code.** Only code without an object of the product, used by several slices now (FSD extraction rule; the "three copies" rule of the entity prompt): a helper to `shared/lib/<topic>/`, a component to `shared/components/`, a test helper to `src/test/<topic>/`.
6. **Every piece of logic in the module that owns it.** Placing a file is not enough: list each rule, look, query, stream and command that the file holds, and put each one in the module of the object it is about, at the lowest layer that may hold it. A file that holds logic of two modules is split, also when it is copied from a backup as it is. Concretely:
   - a reading rule or a look of an object (an order, a condition on a status, the stage title a status names, the look with its label) goes to the entity of that object, even when one block reads it today, in the topic of the fields it reads (a hook that reads `current_stage` of a run is in `runs`, not in `status`). Its parameter is `Pick<Object, ...>` of those fields, so the fields name the topic, and a topic that may read no other topic cannot take the type of another;
   - a helper that reads or changes the cache of the queries, or calls the API, is a hook in `hooks/`, beside the hooks of its resource in `use<Resource>Queries.ts`, which may hold several hooks; there is no `queries` kind of file, and a `*.utils.ts` file holds pure helpers only (ESLint group `queriesInUtils`);
   - the life of the stream of an object (open, reload the object, open again, close) goes to the entity of that object; a module above adds only its own reaction, through a callback, such as the threads of a project that load again when a run changes status;
   - a command of the palette or a button of an action, with the rule of when it shows, goes to the feature of that action and takes the object as a prop or an argument; the widget gives it the object and decides nothing;
   - a widget joins words, passes objects to features and components, and chooses only how a block looks where it sits (fill, size, classes). It imports no `<value>Look`, `<value>Label` or rule of an entity directly when the entity offers a hook for them, and no `useCommands` for an action of a feature;
   - an entity that gets a part which changes for other reasons than what it holds (the run that the status of a project shows, beside the projects themselves) splits by topic: one folder per topic, listed in `topicEntityModules` of `lint/lib/file-names/file-kinds.constants.js` with the topics that each reads, two topics that read nothing of each other when possible. The files already there move to their topic with `git mv` in the `refactor` commit (Docs-first rule, item 3); `components/`, `@x/` and `index.ts` stay at the root;
   - the exports follow the readers: an `@x/<module>.ts` exports only what that module reads, and the `index.ts` of an entity drops an export that no slice outside reads any more once a hook replaces it (`runStatusLook` once `useRunStatusLook` exists).

   The plan says, for each new file outside the entities, which logic it holds, and checks the list above. Section 15 of the plan adds a grep that answers nothing when the widget reads no rule itself.

## Folders inside a feature or a widget

- **A slice is named after what it does or shows.** The folders right under `features/` and `widgets/` are slices, one per action (`stop`, `rename`, `send-message`) or per block (`status`, `list`, `chat`), never named after a kind of file: no `features/components/`, `features/hooks/`, `widgets/utils/`, `widgets/types/`. Two actions that always change together are one slice; one slice that does two unrelated things is two.
- **Inside a slice, folders by kind, from two files on.** A slice holds its components in `components/` and its hooks in `hooks/` once it has two of them or more; a lone component or a lone hook stays at the root of the slice (`StopRunDialog.tsx`, `useStopRunCommand.ts`), as a lone `types`, `store`, `constants` or `utils` file does. Two files of another kind go in the folder of that kind in the plural (`stores/`, `utils/`). Each folder keeps its own `__tests__/`; the tests of the files at the root sit in `__tests__/` at the root.
- **A large slice groups its components by part.** When `components/` holds many components, they group in sub-folders named after the part of the block they make, such as `components/cards/` of the design system page, each with its own `__tests__/`.
- **Small parts stay in their file.** A sub-component that one component uses stays in that component's file. A component file that grows past one concern splits by concern, not into one file per component.
- **Names do not change.** `PascalCase.tsx` for components, `useSomething.ts` for hooks, `<subject>.<kind>.ts` for the rest, tests as `<file>.test.ts(x)` and `<file>.data.ts`.

The entities keep their rule: folders by kind, or by topic for the modules in `topicEntityModules` (`run`, `workflow`, `project`), where a topic holds its files flat, `<subject>.<kind>.ts`, with its `hooks/` and `__tests__/`.

## Naming

| Part | Rule | Examples |
|---|---|---|
| Feature slice | The action, a verb or a verb with its object, kebab-case | `stop`, `rename`, `send-message`, `retry` |
| Widget slice | The block, a noun | `status`, `list`, `menu`, `commands`, `dialogs`, `chat` |
| Component of an action | `<Verb><Object><Role>`, the role among `Button`, `Dialog`, `Form`, `Menu`, `Field` | `StopRunButton`, `StopRunDialog`, `RenameProjectDialog` |
| Component of a block | `<Object><Block>` | `ProjectRunStatus`, `ProjectTable` |
| Component that registers and renders nothing in place | `...Item` for the status bar or the activity bar, `...Commands` for the palette, `...Dialogs` for the dialogs mounted once, `...Streams` for streams followed | `ProjectRunStatusItem`, `ProjectCommands`, `ProjectDialogs`, `ProjectRunStreams` |
| Mutation hook | `use<Verb><Object>`, in a file named after it | `useStopRun`, `useRenameProject` |
| Hooks of a dialog store | `useOpen<Verb><Object>Dialog` (opens it), `use<Verb><Object>Dialog` (its state), both in `useOpen<Verb><Object>Dialog.ts` | `useOpenStopRunDialog`, `useStopRunDialog` |
| Hook that registers commands | `use<Verb><Object>Command` for one, `use<Block>Commands` for several | `useStopRunCommand` |
| Hook of a block | `use<Block><What it gives>` | `useProjectFilterFields` |
| Hook that wraps a hook of a module below | Named after its own object, not after the one it wraps | `useProjectRunStream` over `useRunStatusEvents` |
| Hook of a query or cache helper | `use<Verb>...`, in the `use<Resource>Queries.ts` of its resource | `useReloadThreadsIfRunStatusChanged` in `useThreadQueries.ts` |
| Result of a hook that combines queries | `<Object><What>Result`, a union with `state` | `ProjectRunResult` of `useProjectRunResult` |
| Store | `<topic>.store.ts`, exporting `use<Topic>Store` | `stop-run-dialog.store.ts` with `useStopRunDialogStore` |
| Words of a slice | `<topic>Messages` in `<topic>.constants.ts` | `stopRunMessages`, `projectRunStatusMessages` |
| Pure rule | Named after what it gives, no `get` or `check` prefix | `stoppableRun`, `threadsByAttention`, `threadsWithUnfinishedRun` |
| Boolean | `is`, `has`, `can`, `needs` | `isUnfinishedRunStatus`, `needsUser`, `hasStageName` |
| Event props and callbacks | `on<Event>` for a prop; a callback is named after what it does, never `handle...` (ESLint) | `onOpenChange`, `onClosed`, `openDialog` |
| Palette command id | `<module>.<action>` | `run.stop`, `projects.rename` |

Names that ESLint refuses (`lint/lib/names/`): `data`, `info`, `tmp`, `obj`, `res`, `msg`, `btn` and the other vague names, `handle...`, and the retired words (sign in, sign up). One concept has one name across the modules: reuse the name of the entity (`Run`, `Thread`, `runStatusLabels`) instead of a new one.

## State: where it lives and how it is named

| State | Where | Name |
|---|---|---|
| Data of the server | The query hooks of the entities, never copied into a store or a `useState`; a block keeps the id and reads the rest from the queries | `use<Resource>`, keys of `<resource>Keys` |
| A value derived from the data | A pure function of a `utils` file, or a hook that combines queries and returns a union with `state` (`pending`, `error`, `success`) | `shownRun`, `useProjectRunResult` returning `ProjectRunResult` |
| The thing a dialog acts on, when several places open it | A pending action store of the feature: `createPendingActionStore()` | `use<Action>DialogStore`; state `targetId`, `open`; actions `openDialog`, `setOpen`, `closed` |
| A request from one part to another, such as "take the focus" | A small zustand store of the feature, named after the request | `useProjectPromptStore` with `focusRequested`, `requestFocus`, `focused` |
| The state of a block, such as the open tab or what is expanded | A store of the widget, or `useState` inside a hook of the block; persisted with `persistStorage` of `@/shared/lib/storage` when it outlives a reload | `<block>.store.ts` |
| The fields of a form | `react-hook-form` with the schema of a `<form>.schema.ts` | `<form>FormSchema` |
| Whether a mutation that another part started is pending | A small hook in the file of the mutation hook | `useIsCreatingProject` |
| Items, commands and dialogs on the frame | The registries of the frame (`useStatusBarItem`, `useCommands`, `useActivityBarItem`), never a store of the slice | - |
| A counter or a timer inside one hook | `useState` or `useRef` inside that hook | `reopened` |

- A state field is named after what it holds (`targetId`, `focusRequested`), an action after the intent (`openDialog`, `requestFocus`), and a field that reports an event in the past tense (`closed`, `focused`).
- A component imports no store, no `*.api` file and no TanStack Query; it calls the hooks of its slice (ESLint).
- A destructive action: only the `*Dialog.tsx` file calls its mutation hook (ESLint); menus, rows and commands open the dialog through its store. A hook named `use...Command` only opens that dialog, so any file may call it.
- A hook that imports `useState`, `useEffect`, `useEffectEvent` or `useRef` from React starts with `'use client'` when a Server Component reaches it through an import, often through an `index.ts` or an `@x` file (the layouts of `src/app/` import `@/modules/project/entities` and `@/shared/components/frame`). The plan follows the imports from each layout that the PR touches to every new hook. Typecheck and the unit tests do not catch it; only `pnpm build` and E2E do.
- An effect that starts async work (a reload after an event, a timer that opens a stream again) keeps a `closed` flag that its cleanup sets, and reports nothing once it is set. The plan names the flag in the sketch, and the tests have a case that fails without it (a load that ends after the stream closed tells nobody).

## Labels, looks and classes of a value

A value with a fixed set of states (a run status, an interrupt status, a review status) shows the same way on every screen, so its words and its look belong to the entity of its object:

- **Labels:** `<value>Labels` in `<value>.constants.ts` of the entity, a `Record<Value, Wording>` with `satisfies`, one word per view (`runStatusLabels` with `developer` and `user`), read through a function of a `utils` file (`runStatusLabel(status)`).
- **Look:** `<value>Looks` in `<value>-look.constants.ts` of the entity, a `Record<Value, Look>` with `satisfies`: the tone, the icon, and the flags that the screens read (`needsUser`). Read through `<value>Look(value)` of `<value>-look.utils.ts`. The look of "no value yet" sits beside it (`noRunLook`). The model is `modules/run/entities/status/`.
- **Tone, not classes.** The look names a `Tone` of `@/shared/lib/tone`, never a class. Components take it through the `color` and `variant` props of `Badge`, `Button`, `Alert`, `Progress` or `Spinner`, whose classes come from `toneClasses`. A new color is a new tone in `shared/lib/tone/` with its tokens in `src/app/styles.css`, in a commit of its own.
- **One config, several components.** Two components that show one value with different layouts (a badge in a table, a pill on the status bar) stay two components, and both read one hook of the entity, `use<Value>Look(value)` in `<value>/hooks/use<Value>Look.ts`, which gives the look with its label in the view of the app (`useRunStatusLook`: tone, icon, `needsUser`, label). Neither calls `<value>Look` and `<value>Label` itself. A component of the entity (`RunStatusBadge`) and a component of a widget read the same hook.
- **What a block varies** (a solid fill for a status that needs the user, a larger badge on the status bar) is decided in the block, from the flags of the look; the look holds no fill and no size, and the block adds no new look.
- **Classes of a block** stay in the component that renders them. Classes that two components share become a small component of the slice, or of shared code, styled by its `data-*` or `aria-*` attributes; never a `xClassName` constant. A value in brackets (`max-h-[...]`) becomes a token of the `@theme` block of `styles.css`.
- **Words of a slice** (titles, buttons, toasts, the text of an error, the label for assistive technology) are values of its `<topic>Messages`; a component writes no sentence itself.

## Screen states and accessibility

For each block, the plan lists every state the user can reach, what shows, and the scenario of the page URL that shows it in `pnpm dev:mock`:

- loading, error with the way to try again, empty, and each state of the value it shows;
- each answer of the action: success (toast, what reloads), each error status of the API, the dialog that stays open on a failure;
- `role="status"` for a state that changes on its own, `role="alert"` for an error, a label for assistive technology on every icon-only control and on a link whose text does not say where it goes;
- the keyboard: the focus after a dialog opens and closes, the hotkey of a command;
- `expectNoAccessibilityViolations` in the tests of the block.

## What to write in the plan

The plan has these sections, in this order:

1. **Row in the PR table.** Branch (`feat/fe/<name>`), PR title, what it needs (merged PRs, the refactor PR of a new rule), what comes after, docs-first notes.
2. **What was read.** Table of every source consulted, with what it gave this PR.
3. **Decisions.** Numbered, each with the rule and why: placement of every new file and of every piece of logic in it (section [Placement across modules](#placement-across-modules), item 6), the folders inside each slice, what each copy from a backup changes and what is dropped, the state of each part, how the block reloads after an action or an event, what is extracted to shared code.
4. **Scope.** The endpoints the actions call, the queries the blocks read, what is copied from where, what is written new, what is not copied and why.
5. **Naming.** Table with the rule and the chosen name for each part (slices, components, hooks, stores, words, rules, command ids).
6. **Shared code first.** Three tables: Reuse (what, from where, for what), Extract before new code (with the path and why), and Checked, not extracted (each candidate looked at, such as a component that a later PR may also need, with the count of its copies and why it stays). Grep the backup and the rows of the PRs that come next for the same code, so that a second user planned soon is counted.
7. **Changes to existing modules.** Table of the files outside the new slices that change (entities, `@x` files, mocks, layouts, shared code, tests helpers, lint), what changes, and in which commit.
8. **The slices, file by file.** For each new slice and each new entity part: an ASCII tree, a table (file, what it holds, what it reuses), then sketches of the types, the hooks and the components with their JSDoc.
9. **State and data flow.** The table of section [State](#state-where-it-lives-and-how-it-is-named) filled for this PR, and a short flow: what loads first, what an event or an action reloads, what the user sees meanwhile.
10. **Screen states and words.** Table: state, what shows, scenario of the page URL. Then the words, as the `Messages` objects will hold them.
11. **Mocks and screenshots.** The mock changes the states need (a scenario, a handler answer), and the screenshot cases to add.
12. **Tests.** Table of test files, each with its cases. Every action has the cases of `itAsksBeforeAction` or `itToastsOnResult`, every block the cases of its states, every pure rule a data-driven test. Then the helpers: each setup or step that two test files repeat (rendering the frame, opening the palette, finding the status bar, a fake object) is named once, a step or a render helper in `src/test/<topic>/` when tests of several slices use it, a builder in one `__tests__/<topic>.utils.data.ts` of the slice when only that slice does (`runWith(status)` of `run/features/stop`); the table says which test files import it.
13. **Docs to update.** Which docs change in the PR (Web App Modules, Web App, CONTRIBUTING, frontend README, mocks README, the implementation plan).
14. **Left for the next PRs.** What this PR deliberately does not build, and where each item is tracked.
15. **Commits and checks.** Numbered one-line commits in order: the lint first (`build`, with its tests), then moves (`git mv`, alone, as `refactor`), then the entity rules, then reading and following the data, then the features with the mock and the test helpers they need, then the widgets with their mount point and the screenshot cases, then docs, so that each commit compiles and passes its tests.
   - Each file goes in one commit, named in the table of section 7 or 8. The plan lists the few files that two commits change (the `index.ts` of an entity, a lint constants file, a lint test) and which part goes in which commit; the guides (CONTRIBUTING, Web App Modules, Web App) go whole in the `docs` commit.
   - The plan and this prompt stay local: they are not committed.
   - Then the checks: ESLint and Prettier on the changed files, Vitest on the touched folders, typecheck once; no full suite, E2E, screenshots or build locally. A test that times out only when run with the others is run again alone before it counts as a failure.
16. **Checklist.** Tickable items for the user and the agent before opening the PR. The last item writes the description of the PR from the plan; the endpoints it lists are checked against the `*.api.ts` functions that the hooks call, not against the plan.

## Rules to follow while writing

1. **No business logic in shared code.** A helper free of the product can go to `shared/lib/`; one that names an object of the product stays in the module that owns it.
2. **A widget adds no rule, and every piece of logic sits in the module that owns it.** If a block needs a rule (an order, a choice, a condition on a value, when an action shows), the rule goes to the entity or the feature that owns it, and the widget calls it ([Placement across modules](#placement-across-modules), item 6).
3. **The mock does not repeat a mistake of the app.** Its answers follow the API doc, not the rules of the app's forms.
4. **Every decision is prescriptive.** Write "do X", not "consider X". The agent applies, it does not choose.
5. **Short paths convention.** `run/features/stop/...` means `frontend/src/modules/run/features/stop/...`, `mocks/...` means `frontend/src/mocks/...`, `test/...` means `frontend/src/test/...`. State this at the top.
6. **ASCII-only prose.** No em dashes, no arrows, no emoji; Vietnamese letters and tree lines allowed. Check with `grep -nP '[^\x00-\x7F]'`.
7. **No requirement ids or doc paths in code comments**, and no comment that cites the backend or a screen as the reason for a rule; state the rule.
8. **Commit messages: one line, conventional-commit form, no AI attribution.**
