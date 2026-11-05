# Prompt: create a frontend feature or widget plan

Write a plan for a frontend PR that builds features, widgets, or both: an action of the user (stop a run, rename a project, send a message), a block of the screens (the status of a project, the list of projects), or a screen made of them. The prompt holds for every module and for a PR that spans several modules; it names no module of its own. For a PR that only adds the entities of a module, use [Prompt: create a frontend entity plan](prompt-create-frontend-entity-plan.md) instead.

The plan is a single markdown file in `docs/`, named `frontend-<id>-<name>-plan.md`, with the id of its row in the PR table of the [Frontend implementation plan](frontend-implementation-plan.md) (for example `frontend-p7-project-status-plan.md`). An agent implements from it, so it must be prescriptive: every decision is made and written down, the agent only applies it.

The plan is written from the code on `main`, not from the plan of the PR before it: its first paragraph names the commit of `main` it was checked against, and says that when the code differs from the plan (a name, a path, a signature), the agent stops and reports the difference instead of choosing. A plan written while the PR above it was still open is checked again once that PR has merged. (The first drafts of S1b, S1c and S1d were written before S1a merged; by then every path they named had moved to a topic folder.)

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

1. An endpoint, a field, a status code or a rule of the API (`docs/API.md`, `docs/DATA_SHAPE.md`, the workflow definition and its schema): propose the fix on the `docs/fe/api-fields` branch, or tell the user to add it there.
   - The plan names those commits as a docs PR of its own (`S1b.D`), merged before the PRs that read the change, as #56 came before S1a, and never puts them in a maintenance PR of `frontend/`. Read `git log main..origin/docs/fe/api-fields` first: the branch may already hold a change that the plan was about to make (S1b found the rename of the module `trace` there, `10f0259`).
   - A file of `docs/` that a test compares with a copy in `frontend/` (the workflow definition and `mocks/workflow/`) changes with its copy in the same commit.
   - The plan says what the server repository has to follow (a field, a check, a prompt of an agent), since the user changes it there.
   - A field that the API renames changes in the mock and in the entity that parses it in one commit of the app, with every reader of the old name (S1b: `quote` became `target_quote`, read by `traceLinkSchema`, the trace graph and the mock); a commit that changes only one side breaks the parse of the other.
2. What a screen shows or how it behaves (`docs/ui/usability.md`, `docs/ui/skeletons.md`, `docs/architecture/web-app.md`): ask the user, and write the answer in that doc before the code.
   - `docs/ui/usability.md` lives on the branch `frontend-plan` only, not on `main`: the answer goes there, in the working tree of `frontend-plan`. `docs/ui/skeletons.md` and `docs/architecture/web-app.md` are on `main`: the answer goes in a `docs` commit of the PR.
   - The plan lists its questions in section 1, in a table: an id (`A1`, `A2`, ...), the question, and the proposal that the plan builds, with the decision that builds it. The agent builds the proposal; the user confirms or changes it before the PR that shows the screen. A PR of entities or of the frame does not wait for the answers, since it shows no screen.
   - The checklist has an item for the answers, and one for the answers of the PR before that are not written yet. (S1a asked seven questions and built the answers, but none reached `usability.md`: open point 7 stayed open and 5.3 still drew the old marks.)
3. A placement or naming rule (`docs/architecture/web-app-modules.md`, `frontend/CONTRIBUTING.md`): the change goes in a `docs` commit, and a rule that ESLint checks changes in `frontend/lint/` in a `build` commit, both before the code that follows the new rule. A change that moves existing files to a new rule is a refactor PR of its own, before this one, except a move that only the new files of this PR call for (an entity that gets a second topic): that move is the `refactor` commit right after the `build` commit of this PR.
   - A placement mistake that a selector can catch (a `*.utils.ts` that imports TanStack Query) gets an ESLint check in the same `build` commit, so that the next PR cannot make it again. A later config block replaces the whole `no-restricted-syntax` or `no-restricted-imports` rule of an earlier one, so a new check is a new group of `lint/lib/syntax/syntax-groups.constants.js`, added to each block of files that it covers, with a case in `lint/configs/__tests__/configs.test.js`.
   - A lint test that takes a module as the example of a rule (a module without topics) changes its example when the PR changes that module.
4. The plan notes every gap in its "Left for the next PRs" section, with where it is tracked.

No code and no mock answers an endpoint that the API does not describe, and no screen shows a state that the UI docs do not describe.

## Sources to read before writing

Read these in order. Each gives a different layer of context.

### 0. What the PRs before built

| Source | What to take |
|---|---|
| `git log --oneline origin/main`, `gh pr view <number>` of the PRs of the same screen or the same modules | What was merged, in which PRs, and what each body lists |
| The plan of the PR before, and the code it became | The differences between that plan and `main`: paths that moved, names that changed, a hook split into several, words changed in the review, a helper that went to shared code, a bug left behind. Section 2 of the plan gets a table of them: the plan said, built, the rule this plan takes from it |
| The "As built" notes of the implementation plan | The same, for older PRs |

Read the code of `main` itself for every file the plan changes or reuses (`git show origin/main:<path>` when the checkout is on another branch), never the plan of the PR before.

### 1. Concept, screen and architecture docs

| File | What it gives |
|---|---|
| `docs/ui/usability.md` (branch `frontend-plan`) | What the user sees and does, in user words; the decisions D0 to D6 that every screen meets; the developer view and the user view |
| `docs/ui/skeletons.md` | The frame and the regions of each screen |
| `docs/architecture/web-app.md` | How the screens read the data; section 9 lists the files of each part |
| `docs/architecture/web-app-modules.md` | Section 2 (what an entity, a feature and a widget hold), section 3 (kinds of file), section 5 (imports and `@x`), section 9 (blocks that read several modules) |
| `docs/API.md`, `docs/DATA_SHAPE.md` | The endpoints that the actions call, their status codes and errors; the fields that the blocks show |
| `frontend/CONTRIBUTING.md` | Inside a slice, hooks of a slice, files of a slice, dialogs opened from several places, destructive actions, toasts, the shared code table |
| `frontend/README.md`, `frontend/src/mocks/README.md` | The mock scenarios of the page URL, the screenshot tests |

### 2. The entities the slices read

For each module that the slices read, open `src/modules/<module>/entities/index.ts` and its `@x/` files, and list what the plan uses: query hooks, keys, types, looks and labels, pure rules. Anything missing is either added by this PR to the entity that owns it (section 7 of the plan, as a commit before the slices) or waits for the entity PR of its module; the plan says which.

Before planning a view of a relation, read the fixtures and the API doc for where its data sits: which side of a link holds a value, and which links hold none. The quote of an `evidenced_by` link is words of the message, its target; no other link holds words. A draft of S1b marked every link in the text of an item, which no data allows.

### 3. Shared code and the frame

Grep these exports before writing anything new. The plan reuses them by name in its "Shared code first" section.

| What | Path | Use it for |
|---|---|---|
| Status bar | `useStatusBarItem`, `StatusBarSide` of `@/shared/components/frame` | A block that shows in the status bar while its component is mounted |
| Activity bar | `useActivityBarItem`, `ActivityBarItem`, `FeatureDestination` of `@/shared/components/frame`; the `*.config.tsx` files of the features | A feature with an item on the activity bar and a side panel |
| Command palette | `useCommands`, `PaletteCommand`, `PaletteGroup` of `@/shared/components/frame` | The commands of a block, registered while it is mounted |
| Tabs and pages | `useEditorTab` (with `isTitleProvisional`; it returns the function that keeps the tab), `useOpenPage` (options `keep`, `inPlace`, `title`), `useTabIcons`, `useTabIcon` of `@/shared/components/frame`; `SidePanel` with its `footer` | A page that opens in a tab; the icons of the tabs of a feature; a page that reads through a list in one tab |
| Mount points | `contributions` of `Workbench`, in the layouts of `src/app/` | Where a layout mounts the widgets that register items, commands and dialogs |
| Registry | `createRegistryStore`, `useRegisterItem`, `useRegisteredItems`, `OrderedItem` of `@/shared/lib/registry` | A new place where components register items; the status bar and the activity bar are built on it |
| Pending action | `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` of `@/shared/lib/pending-action` | Every dialog: a confirm, a form in a dialog |
| Dialogs and buttons | `ConfirmDialog` (`shared/components/ui/confirm-dialog.tsx`), `PendingButton`, `Dialog` | Every destructive action asks with `ConfirmDialog` |
| Forms | `Form`, `TextField`, `FormField`, `NumberField` of `@/shared/components/form` | A form with a schema file |
| States of a block | `LoadingState`, `ErrorState`, `EmptyState`, `NotFoundState` of `@/shared/components/state` | The loading, error and empty states of a page or a panel |
| Tones | `Tone`, `toneClasses` of `@/shared/lib/tone`; the `color` and `variant` props of `Badge`, `Button`, `Alert`, `Progress`, `Spinner` | The color of a state |
| Views | `useView`, `Wording`, `useWording(wording)` of `@/shared/lib/view` | A word that differs between the developer view and the user view |
| Errors and toasts | `errorMessageOf` of `@/shared/api/error`; `toast` of `sonner`; `actionToastDuration` of `@/shared/lib/timing` | What follows a mutation |
| Routes | `routes` of `@/shared/routes` | Every link and every navigation |
| Other helpers | `shared/lib/`: `timing` (`debounce`, `sleep`, `useNow`, `coalescedTask` for a task whose calls during a run share one more run after it, `useIdleVisibility` for a control that hides after a moment without action), `text` (`textOf`, `quoteRange`, `rangesOfQuery`, `splitByRanges`), `hierarchy` (`ancestorsOf`), `storage`, `hotkey`, `viewport`, `hydration`, `formatters`, `guards`, `collections`; `ColoredText` of `shared/components/ui/colored-text.tsx` for a text in the color of a level | Before writing a helper, check that none of them does it |
| Test suites | `@/test/suites`: `itAsksBeforeAction`, `itShowsQueryStates`, `itToastsOnResult`, `itAsksForFieldsBeforeSending`, and the query hook, query key and request suites | The cases that every action and every block has |
| Test steps | `@/test/steps`: `findConfirmDialog`, `confirmAction`, `cancelAction`, `pressButton`, `expectText`, `expectNoAccessibilityViolations`, `statusBar()`, `openCommandPalette()`, ... | The steps of a test with a flow of its own |
| Rendering | `renderWithProviders`, `renderHookWithProviders` and `TestProviders` of `@/test/render`; `renderWorkbench(contributions)` with `rerenderContributions`; `renderDocumentsFrame(page, { pathname, params, scenario })` for a page of Documents | A component or a hook with the query client, the view and the frame; a slice that contributes a status bar item, commands or dialogs, read where the frame shows them |
| Streams and waits in tests | `EventSourceStub`, `resetEventSources` of `@/test/event-source` (set up in `vitest.setup.ts`); `sleep(ms)` of `@/shared/lib/timing`, never `new Promise(setTimeout)` | A hook that follows an event stream; a test that waits for a time |
| Mock scenarios | `answerScenario`, `mockScenario`, `mockRunStatus` of `src/mocks/shared/scenario/` | The URL parameters that show each state in `pnpm dev:mock` and in the screenshots |

Name the props and the signatures as the files on `main` name them (`size="compact"` of the states, `action` of `NotFoundState`, `rows` of `LoadingState`), not in words of your own: an agent that meets a word that is not in the code guesses. Open the file of each shared component the plan uses and copy its props.

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
   - Do the check for each new hook and component, not only for the slice: list the modules it imports and look each one up. The first draft of S1b put a lock that reads the run and a status that reads the trace links in `artifact`, which may read `workflow` only.
   - What a lower module needs from a module above it comes in from the widget, as a parameter or a callback: `isLocked` for the features of `artifact`, the ids of the out of date items for the outline, `onChanged` that reloads the traces after an edit (FSD strategy C).
3. **How two slices meet.** A feature never imports another feature, and a widget never imports another widget. When two actions meet in one block, the widget imports both and connects them by props, for example by giving the run on screen to Stop (FSD strategy C, composition from the layer above). When an entity needs another entity, it goes through `@x/<module>.ts` of the entity it reads, which exports only what it reads. A feature that has to refresh queries of modules above its own cannot name their keys: it invalidates a wider key that it may import, and the plan says why.
4. **Where it mounts.** A widget that registers items, commands or dialogs is mounted by a layout of `src/app/`, in the `contributions` of `Workbench`, once per layout. Every dialog is mounted once there too, by a `...Dialogs` widget, and its trigger opens it through the store of its feature, as Delete project and Rename project do with `ProjectDialogs`. This holds also for a dialog that one place opens (a discard confirm, the restore of a version): no dialog sits beside its trigger with its own state. When the target of a dialog is more than one id (a record and a version), the store keeps a key made by a pure helper of the entity (`revisionKeyOf`), read back by its pair (`parseRevisionKey`). The S1b plan first kept two dialogs beside their triggers; the user asked for stores.
5. **What goes to shared code.** Code that holds no rule and names no object of the product goes to shared code from its first user, whatever the count of its users (the user, 2026-11-05; this repository does not follow the extraction rule of FSD, "extract when several places use it", for such code): a helper to `shared/lib/<topic>/`, a hook to `shared/lib/<topic>/hooks/`, a component to `shared/components/`, a test helper to `src/test/<topic>/`. Code that names an object of the product, or applies one of its rules, stays in the module of that object.
   - Ask of each helper, hook and component that the plan writes: "Does it read or decide anything about an object of the product?" A rounded duration, the key that sends a prompt, the scroll of an element into view, the width of a dialog, a listener that coalesces the bursts of a stream: no, so shared code. The order of the run statuses, the words of a line of work, the stages that a run went through: yes, so their module. A generic mechanism inside a rule of the product is split: the mechanism to shared code, the rule stays (the stream of a run: which stream, which events and when to listen stay in `run`; the listener that coalesces goes to `shared/lib/timing`).
   - Grep shared code and the code of the modules for a copy before writing anything: an existing helper is reused, and a copy found in a module moves to the shared helper in the same PR (a maintenance commit when the copy is old code).
   - Code with a rule of the product follows the "three copies" rule inside its module: three copies of the same steps in one PR are a helper of the entity (`useApplyRecordChange`, what follows a change of a record in two features). A second user that the next PR of the same screen adds counts as a user now, so that the next PR moves nothing (the first S1c draft moved `ItemSources` from a widget to the entities with `git mv`).
6. **Every piece of logic in the module that owns it.** Placing a file is not enough: list each rule, look, query, stream and command that the file holds, and put each one in the module of the object it is about, at the lowest layer that may hold it. A file that holds logic of two modules is split, also when it is copied from a backup as it is. Concretely:
   - a reading rule or a look of an object (an order, a condition on a status, the stage title a status names, the look with its label) goes to the entity of that object, even when one block reads it today, in the topic of the fields it reads (a hook that reads `current_stage` of a run is in `runs`, not in `status`). Its parameter is `Pick<Object, ...>` of those fields, so the fields name the topic, and a topic that may read no other topic cannot take the type of another;
   - a helper that reads or changes the cache of the queries, or calls the API, is a hook in `hooks/`, beside the hooks of its resource in `use<Resource>Queries.ts`, which may hold several hooks; there is no `queries` kind of file, and a `*.utils.ts` file holds pure helpers only (ESLint group `queriesInUtils`);
   - the life of the stream of an object (open, reload the object, open again, close) goes to the entity of that object; a module above adds only its own reaction, through a callback, such as the threads of a project that load again when a run changes status;
   - a command of the palette or a button of an action, with the rule of when it shows, goes to the feature of that action and takes the object as a prop or an argument; the widget gives it the object and decides nothing;
   - a widget joins words, passes objects to features and components, and chooses only how a block looks where it sits (fill, size, classes). It imports no `<value>Look`, `<value>Label` or rule of an entity directly when the entity offers a hook for them, and no `useCommands` for an action of a feature;
   - an entity that gets a part which changes for other reasons than what it holds (the run that the status of a project shows, beside the projects themselves) splits by topic: one folder per topic, listed in `topicEntityModules` of `lint/lib/file-names/file-kinds.constants.js` with the topics that each reads, two topics that read nothing of each other when possible. The files already there move to their topic with `git mv` in the `refactor` commit (Docs-first rule, item 3); `components/`, `@x/` and `index.ts` stay at the root;
   - the exports follow the readers: an `@x/<module>.ts` exports only what that module reads, and the `index.ts` of an entity drops an export that no slice outside reads any more once a hook replaces it (`runStatusLook` once `useRunStatusLook` exists);
   - a hook that joins the data of several modules goes to the entities of the highest module it reads (`useItemSources` and `useItemLinks` in `documents`), and the pure rule it applies stays in the entity of its object, taking what that entity may not import as a parameter (`itemLinkGroups(trace, itemId, linkTypes, titleOf)`, as `traceGraphOf` takes `titleOf`); a module below gains no `@x` import for it;
   - a component of an entity takes data and render props or slots, never an address: the widget knows the routes (`renderItemLink`, `renderItemKey`, `actions`, `renderRestore`);
   - a link to the page of an object goes through one helper that gives the address of any object of its kind, and the plan checks that every object of that kind has the page: a kind with `x-ui-navigable: false` has none (S1a linked each message of a transcript to an item page that answered "not found"; S1b adds `useItemHref`).

   The plan says, for each new file outside the entities, which logic it holds, and checks the list above. Section 16 of the plan adds a grep that answers nothing when the widget reads no rule itself.

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
| Pure rule that builds the body of a request from a form | `<object><Request>Body` | `itemUpdateBody`, not `itemChange` |
| Boolean | `is`, `has`, `can`, `needs` | `isUnfinishedRunStatus`, `needsUser`, `hasStageName` |
| Event props and callbacks | `on<Event>` for a prop; a callback is named after what it does, never `handle...` (ESLint) | `onOpenChange`, `onClosed`, `openDialog` |
| Palette command id | `<module>.<action>` | `run.stop`, `projects.rename` |

Names that ESLint refuses (`lint/lib/names/`): `data`, `info`, `tmp`, `obj`, `res`, `msg`, `btn` and the other vague names, `handle...`, and the retired words (sign in, sign up). One concept has one name across the modules: reuse the name of the entity (`Run`, `Thread`, `runStatusLabels`) instead of a new one.

## State: where it lives and how it is named

| State | Where | Name |
|---|---|---|
| Data of the server | The query hooks of the entities, never copied into a store or a `useState`; a block keeps the id and reads the rest from the queries | `use<Resource>`, keys of `<resource>Keys` |
| A value derived from the data | A pure function of a `utils` file, or a hook that combines queries and returns a union with `state` (`pending`, `error`, `success`) | `shownRun`, `useProjectRunResult` returning `ProjectRunResult` |
| The thing a dialog acts on, for every dialog | A pending action store of the feature: `createPendingActionStore()` | `use<Action>DialogStore`; state `targetId`, `open`; actions `openDialog`, `setOpen`, `closed` |
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
- A component that a layout mounts and that reads `useSearchParams` sits in `<Suspense fallback={null}>` in that layout.
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
- the keyboard: the focus after a dialog, a panel or a mode of the page opens and closes, the hotkey of a command; each is written in the row of its component (What to write in the plan, section 10);
- a block that reads a query of its own beside the main data of the page (the links, the history, the quotes) fails alone: its compact error with Try again, an `ErrorBoundary` of `react-error-boundary` around it, and the rest of the page as usual. The plan names each such block;
- `expectNoAccessibilityViolations` in the tests of the block.

## What to write in the plan

The plan has these sections, in this order:

1. **Row in the PR table.** Branch (`feat/fe/<name>`), PR title, what it needs (merged PRs, the refactor PR of a new rule), what comes after, docs-first notes, and the table of the questions to the user (Docs-first rule, item 2).
   - Split work that is more than one review into stacked PRs, in this order: a maintenance PR (`chore/fe/...`) when old code needs a fix, a move or a rename found while planning, one commit each; then the entities of every module the work touches; then the features and the widgets with their mount points. A change of the frame that every screen gets is a PR of its own before the screen. Each PR is based on the branch of the one before, and its base changes to `main` once that one merges. S1a, planned as one PR of 8 commits, became #55 (maintenance), #57 (entities) and #58 (widgets).
   - With several PRs, section 1 is a table (id such as `S1b.0`, branch, title, based on), and sections 7 and 16 name the PR of each file and commit.
2. **What was read.** Table of every source consulted, with what it gave this PR; then the table of the differences between the plan of the PR before and what it built (Sources, section 0).
3. **Decisions.** Numbered, each with the rule and why: placement of every new file and of every piece of logic in it (section [Placement across modules](#placement-across-modules), item 6), the folders inside each slice, what each copy from a backup changes and what is dropped, the state of each part, how the block reloads after an action or an event, what is extracted to shared code. What a component shows and does on the screen is not a decision: it goes to section 10, and a decision that sets a behavior points to its row there instead of describing it.
4. **Scope.** The endpoints the actions call, the queries the blocks read, what is copied from where, what is written new, what is not copied and why.
5. **Naming.** Table with the rule and the chosen name for each part (slices, components, hooks, stores, words, rules, command ids).
6. **Shared code first.** Three tables: Reuse (what, from where, for what), New in shared code (each helper, hook and component without business that the plan writes or moves, with its path, its users and the copies it replaces), and Checked, kept in the module (each candidate looked at that holds a rule or names an object of the product, with that rule). Read the `index.ts` of every folder of `shared/` first, and grep the modules, the mocks, the backup and the rows of the PRs that come next for the same code.
7. **Changes to existing modules.** Table of the files outside the new slices that change (entities, `@x` files, mocks, layouts, shared code, tests helpers, lint), what changes, and in which commit.
8. **The slices, file by file.** For each new slice and each new entity part: an ASCII tree, a table (file, what it holds, what it reuses), then sketches of the types, the hooks and the components with their JSDoc.
9. **State and data flow.** The table of section [State](#state-where-it-lives-and-how-it-is-named) filled for this PR, and a short flow: what loads first, what an event or an action reloads, what the user sees meanwhile.
10. **Behavior of each component.** One table per screen or block, with a row for each component that the user sees or uses, new or changed. The columns:
    - the component and where it shows;
    - what it shows, and when it is disabled or hidden, with the reason that the user reads;
    - what the user does: a click, a key, a hover;
    - what follows: where it leads, the toast, what reloads, what the page shows after;
    - the focus and the keys.

    The behavior on the screen is written here once, and nowhere else. An agent builds a component from its row, without collecting it from the decisions, the words and the tests. Every component of section 8 that renders something has a row.

    Every row settles each of these, or says that it does not apply:
    - the focus when the component opens, when it closes, and when the mode of the page changes (Edit, Save, Cancel): which element takes it, and where it goes back;
    - the keys: Enter, Escape, the hotkey of a command, a key that toggles;
    - for a form: when it checks the fields (on submit, then on each change, with the focus on the first wrong field), what Enter does in an input, and what an empty value or an empty entry of a list sends;
    - for a list that the user edits: the focus after Add and after Remove;
    - how many can be open at once (a diff, a panel, a dialog), and what opening a second one does to the first;
    - how long a mark stays (a highlight, a selected row);
    - what closing does while a request is pending: it is blocked, or the request goes on and its toast still shows;
    - why two controls that look alike behave differently (one toggles, the other only opens);
    - for an action: when it is allowed. A decision holds the table of the states (of the run, the review, the record) with, for each state, whether the action is enabled and the reason that the user reads when it is not; the rows point to it. Check the table against the API doc and ask the user what the server does: the API doc of S1b allowed a change with no active run, and the server allows one only during a review that allows edits.

    The plans of S1b, S1c and S1d first wrote the behavior across the decisions, the screen states and the tests. A check of the three plans found eight interactions that no section settled, most of them about the focus and the keys.
11. **Screen states and words.** Table: state, what shows, scenario of the page URL. Then the words, as the `Messages` objects will hold them: only the new words, written beside the existing ones of the same object, which the plan reads on `main` first (the words of S1a changed in its review: "To read before you approve" became "Needs your review").
12. **Mocks and screenshots.** The mock changes the states need (a scenario, a handler answer), and the screenshot cases to add. Every state of section 11 has a scenario; a state without one gets a new value or a new scenario (`mock-export=failed` on one endpoint, beside `mock-exports` on all three). A scenario that also fails or delays the page does not count for a block of that page: the history of an item shared `mock-item` with the page itself, so S1b adds `mock-revisions`. A state that only a unit test reaches says so, as S1a did for an empty document. Check that the fixtures hold the data a state needs (a chain of links, an out of date link) and name the fixture.
13. **Tests.** Table of test files, each with its cases. Every action has the cases of `itAsksBeforeAction` or `itToastsOnResult`, every block the cases of its states, every pure rule a data-driven test. Then the helpers: each setup or step that two test files repeat (rendering the frame, opening the palette, finding the status bar, a fake object) is named once, a step or a render helper in `src/test/<topic>/` when tests of several slices use it, a builder in one `__tests__/<topic>.utils.data.ts` of the slice when only that slice does (`runWith(status)` of `run/features/stop`); the table says which test files import it.
14. **Docs to update.** Which docs change in the PR (Web App Modules, Web App, CONTRIBUTING, frontend README, mocks README, the implementation plan).
15. **Left for the next PRs.** What this PR deliberately does not build, and where each item is tracked.
16. **Commits and checks.** Numbered one-line commits in order: the lint first (`build`, with its tests), then moves (`git mv`, alone, as `refactor`), then the entity rules, then reading and following the data, then the features with the mock and the test helpers they need, then the widgets with their mount point and the screenshot cases, then docs, so that each commit compiles and passes its tests.
   - Each file goes in one commit, named in the table of section 7 or 8. The plan lists the few files that two commits change (the `index.ts` of an entity, a lint constants file, a lint test) and which part goes in which commit; the guides (CONTRIBUTING, Web App Modules, Web App) go whole in the `docs` commit.
   - Nothing outside the scope goes in the PR: a fix met while building goes to the next maintenance PR (#58 carried the tooltip of the monthly budget and the muted colors of the dark theme beside the documents).
   - The plan and this prompt stay on `frontend-plan`: they are not committed in the PR.
   - Then the checks: ESLint and Prettier on the changed files, Vitest on the touched folders, typecheck once; no full suite, E2E, screenshots or build locally. A test that times out only when run with the others is run again alone before it counts as a failure.
17. **Checklist.** Tickable items for the user and the agent before opening the PR. The last item writes the description of the PR from the plan; the endpoints it lists are checked against the `*.api.ts` functions that the hooks call, not against the plan.

## Rules to follow while writing

1. **Shared code holds what has no business, and only that.** A helper, hook or component that names no object of the product and applies none of its rules goes to shared code from its first user ([Placement across modules](#placement-across-modules), item 5); one that names an object of the product stays in the module that owns it.
2. **A widget adds no rule, and every piece of logic sits in the module that owns it.** If a block needs a rule (an order, a choice, a condition on a value, when an action shows), the rule goes to the entity or the feature that owns it, and the widget calls it ([Placement across modules](#placement-across-modules), item 6).
3. **The mock does not repeat a mistake of the app.** Its answers follow the API doc, not the rules of the app's forms.
4. **Every decision is prescriptive.** Write "do X", not "consider X". The agent applies, it does not choose.
5. **Short paths convention.** `run/features/stop/...` means `frontend/src/modules/run/features/stop/...`, `mocks/...` means `frontend/src/mocks/...`, `test/...` means `frontend/src/test/...`. State this at the top.
6. **ASCII-only prose.** No em dashes, no arrows, no emoji; Vietnamese letters and tree lines allowed. Check with `grep -nP '[^\x00-\x7F]'`.
7. **No requirement ids or doc paths in code comments**, and no comment that cites the backend or a screen as the reason for a rule; state the rule.
8. **Commit messages: one line, conventional-commit form, no AI attribution.**
9. **Review the plan before handing it over**, with both skills of the prerequisites, as code is reviewed: FSD on each import of each new file against `moduleImports` and the layers; Clean Review on the names (a name that says what it gives), the copies (three are a helper), the helpers with one user (they stay in their slice) and the boolean parameters (a named option). The first review of the S1b plan found a helper in shared code with one user, the same reload steps in three hooks, and two vague names. It also moved the links of an item from `trace` up to `documents`, on the belief that `trace` may not read `workflow`; `moduleImports` lets it read `workflow` and `artifact`, so a later review moved them back to `trace`, the module of their object, where the Trace screen can reuse them. Before moving a piece to a higher module, read its row in `moduleImports` and the `@x` files that already exist.
10. **Check the plan against `main` before handing it over.** Every name that the Reuse table and the sketches call existing is an export on `main` (list the exports of `frontend/src` once and look each name up); every decision, section and answer id that the plan cites points at the right one; every path is a path on `main` or a new file of section 7.
