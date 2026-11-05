# Contributing to the frontend

The conventions of the web app in `frontend/`. The workflow, the branches, the commits, the pull requests, the review, the backend, the API contract and the security are in the [root CONTRIBUTING](../CONTRIBUTING.md).

- [TypeScript / React (frontend)](#typescript--react-frontend)
- [Checklist for a new part](#checklist-for-a-new-part)
- [Logging \& Errors](#logging--errors)
- [Testing](#testing)

## TypeScript / React (frontend)

| Tool | Config |
|---|---|
| Type checker | `tsc` with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax` |
| Linter | **ESLint** flat config: `typescript-eslint` (strict-type-checked), `react-hooks`, `@next/next` (core web vitals), `jsx-a11y`, `import` sorting |
| Formatter | **Prettier** (+ `prettier-plugin-tailwindcss`) |
| Package manager | **pnpm** - commit `pnpm-lock.yaml` |

Conventions:
- **No `any`** - use `unknown` + narrowing. No non-null assertions (`!`) without a comment.
- **Modules:** the code is divided by module first (`src/modules/<module>/`, one subject of the product), then by the layers of [Feature-Sliced Design](https://feature-sliced.design) inside each module, then by kind of file inside each slice. Which object, action or block goes in which module, the order of the modules and the modules still planned are in [Web App Modules](../docs/architecture/web-app-modules.md).
- **Import direction** (enforced by ESLint `no-restricted-imports`): a layer imports only the layers under it, `app` -> `widgets` -> `features` -> `entities` -> `shared`, and a module imports only the modules under it, as listed in `moduleImports` of `frontend/lint/lib/modules/module-imports.constants.js` (`project` -> `thread` -> `run` -> `artifact` -> `workflow`; `user` reads `auth` and `run`). ESLint does not load when those lists form a cycle.

  | Layer | Folders | May import |
  |---|---|---|
  | Shared | `src/shared/`: `components/` (`ui/` for shadcn/ui, `frame/` for the frame of the screens and `frame/layouts/` for the layouts of whole screens, `state/` for query states, `form/` for the fields of forms and `form/number/` for the number input and field, `filter/` for the filters of a list), `routes/` for the addresses of the pages, `lib/` (generic utilities, a folder with an `index.ts` for each topic; Helpers of `shared/lib/` lists them), `api/` (server access: `request/` to call the API, `error/` for the errors it answers with, `http/` for its vocabulary (the statuses, methods, headers and media types), `query-client/` for the settings of TanStack Query, `idempotency/`, `generated/`), `config/` (what the app sets once: `env/` for the environment variables, checked when the app starts, `page-names/` for the names of the home pages on the top bar, `output-language/` for the languages of the documents) | Other shared code only |
  | Entities | `src/modules/<module>/entities/`: one slice, the objects of the module, how the web app reads them and shows them (`modules/run/entities/`) | Shared code; the entities of a module under its own only through their `@x/` file |
  | Features | `src/modules/<module>/features/<feature>/`: one slice for each action of the user (`modules/project/features/rename/`) | The entities of its module and of the modules under it, and shared code |
  | Widgets | `src/modules/<module>/widgets/<widget>/`: one slice for each block of the screens that puts objects next to actions (`modules/project/widgets/list/`) | The features and the entities of its module and of the modules under it, and shared code |
  | App | `src/app/`, `src/providers/` | Every layer below |

  - A slice never imports another slice of its layer. The entities of a module reach the entities of another module only through the file that the other gives them, `@x/<module that uses it>.ts` (`@/modules/run/entities/@x/project`); features or widgets that appear together are composed by a widget or by the app layer. A unit test may import another slice of its layer, from its index, to show slices together.
  - A shared component that shows feature content receives it as a prop (`children` or a named `ReactNode` prop) from `src/app/`. Example: `src/app/(project)/projects/[projectId]/layout.tsx` passes the menu of the project into `Workbench`, and in its `contributions` the components that register the commands of the projects and the account menu, with `useCommands` and `useActivityBarItem` of the frame.
  - The rule covers relative paths too: shared code does not reach the layers above it with `../`, and a relative import inside a slice never climbs out of the slice folder (another slice and shared code are imported with `@/`).
  - Code outside `src/shared/components/frame/` imports the frame from `@/shared/components/frame`, its `index.ts`; files inside the folder use relative imports, and the rest of the shared code does not import the frame.
  - `src/mocks/` and `src/test/` are test infrastructure and may import the types and the pure functions of entities (their API functions and hooks are not used there).
- **Public API of a slice:** each slice has an `index.ts` that exports only what other code needs (components, hooks, types). Code outside the slice imports from its folder (`@/modules/run/entities`, `@/modules/project/features/rename`, `@/modules/project/widgets/list`), never from a file inside it (enforced by ESLint `no-restricted-imports`); code inside the slice uses relative imports. Anything not exported from `index.ts` is private and can change freely. A module and its `features/` and `widgets/` folders hold only slices: no `index.ts` and no code of their own.
- **Inside a slice:** components render and handle events. Hooks (`hooks/`) hold the queries and the mutations and what follows a call: navigation, the cache, a toast, and the errors of the API turned into what the page shows, such as a message or the problems at the fields of a form. The `*.api.ts` files send the requests. A component imports no `*.api` module, no `api-request.utils`, no TanStack Query and no `*.store` module (enforced by ESLint); it calls a hook, such as `useIsCreatingProject` for the state of a mutation that another component started. When a slice has many components, they group in folders by the part of the screens they make, each with its own `__tests__/`. The `*.utils.ts` files hold pure helpers that know nothing of the API or the cache of the queries (enforced by ESLint in `src/modules/`), and the `*.schema.ts` files the schemas of the forms, with unit tests. A component file holds what renders: a helper that computes, even one that a single component uses, such as `runStatusLook` of `modules/run/entities/status/run-status-look.utils.ts`, is a function of a `*.utils.ts` of its slice, with unit tests. The words that a slice shows for the answers of the API, such as a toast or the message of an error by its status or code, are values of a `*.constants.ts` of the slice; a hook turns an error into its message with `errorMessageOf` of `api-error.utils`, so no hook writes such words itself.
- **Hooks of a slice:** the hooks that read the API go together by resource, in one `hooks/use<Resource>Queries.ts` for each resource that the slice reads, the queries first and the hooks built on them after, as `useProjectQueries.ts` in `modules/project/entities/projects/hooks/`. A hook built on several resources goes with what it gives. A slice with one such hook keeps it in a file named after it, as `useMe.ts`. Every other hook has a file of its own, named after it: a mutation with what follows it (`useRenameProject.ts`), a stream (`useRunStream.ts`), or a hook of the screens (`useProjectFilterFields.ts`). A small hook that serves one hook only stays in the file of that hook, as `useIsCreatingProject` in `useCreateProject.ts`. The hooks of one store of the slice share a file, named after the hook that the parts call to open or ask, as `useOpenRenameProjectDialog` and `useRenameProjectDialog` in `useOpenRenameProjectDialog.ts`, and `useOpenProjectPrompt` and `useProjectPromptFocus` in `useOpenProjectPrompt.ts`. A hook never lives in the file of a component, even when one component uses it, so that a component file holds what renders (enforced by ESLint, outside `src/shared/components/ui/` and the tests).
- **Files of a slice:** a slice that reads several resources of the API splits its `api`, `types` and `utils` files by resource, `<resource>.<kind>.ts`; a slice that reads one resource has one of each, named after it, as `modules/project/entities/projects/projects.api.ts`. The `schema`, `store`, `reducer` and `constants` files split by topic, `<topic>.<kind>.ts`: a form (`new-project.schema.ts`), a state of the screens (`project-prompt.store.ts`), the events of a stream (`run-events.reducer.ts`), or a part of the screens with its words (`rename-project.constants.ts`). The query keys are one factory for each resource of an entity, `<resource>.keys.ts`, so that the widest key of the resource, such as `projectKeys.all()`, invalidates every query under it. When a slice has two or more files of one kind, they go in a folder named after the kind, in the plural, with its own `__tests__/`: `api/`, `types/`, `utils/`, `schemas/`, `stores/`, `reducers/` or `constants/`, as `modules/artifact/entities/types/items.types.ts` and `modules/artifact/entities/utils/issues.utils.ts`. A kind with one file stays at the root of the slice, as `modules/project/entities/projects/projects.api.ts`. In a feature or a widget, the components and the hooks follow the same count: a lone component or a lone hook stays at the root of the slice (`modules/run/features/start/useStartRun.ts`), and `components/` and `hooks/` hold two files or more; the tests of the files at the root sit in the `__tests__/` of the root. The folders right under `features/` and `widgets/` are slices, named after the action or the block (`stop`, `rename`, `status`, `list`), never after a kind of file. The entities of a slice with many topics (more than about five, such as `modules/run/entities` with `runs`, `steps`, `state`, `directives`, `events`, `config` and `status`, or `modules/workflow/entities` with `definition`, `stages`, `checkpoints`, `issues`, `artifact-kinds`, `content-fields` and `run-parameters`), or with parts that change for different reasons and read nothing of each other (such as `modules/project/entities` with `projects` and `run-status`), split by topic instead: the root holds a folder for each topic, `components/`, `@x/` and `index.ts`, and each topic holds its files flat, whatever their number of one kind (`<subject>.<kind>.ts`), with its own `components/`, `hooks/` and `__tests__/` and no `index.ts` of its own. The topics depend one way: `status` and `config` at the bottom, `runs` above them, `steps`, `state` and `directives` above `runs`, and `events` above `runs` and `status`. The modules that split this way, with their topics and the topics that each one reads, are listed in `topicEntityModules` of `lint/lib/file-names/file-kinds.constants.js`, and a new topic is added there; ESLint reports an import of a topic that a topic does not read, or of `components/`. A component that serves one topic sits in the `components/` of that topic; the `components/` at the root of the entities serves several topics.
- **Types and constants:** a `types` file defines the values of its subject: the types, the Zod schemas, and the lists and objects of values that a type is made from, such as `runStatuses` with `RunStatus`, or `PanelRegion`. A `constants` file holds only the words of the screens and the settings: durations, sizes, keys of the address, orders, looks and defaults, such as `runStatusLabels`, `panelLayouts` and `noProjectFilters`. A `constants` file exports no type and declares no function (a type that only shapes its own values may stay in it, unexported), a file of functions (`utils`, and in `src/mocks` `lookup`, `changes`, `problems` and `handlers`) exports no type either (a type that only it uses stays in it, unexported), and a `types` file imports no `constants` file (enforced by ESLint), so that the two never import each other. The schema of a form stays in its `schema` file, and a type that only describes the props of a component, the state of a store or of a reducer, or the parameters and the result of the functions of one file stays in that file.
- **Names of folders in `shared/`:** a topic is singular (`http`, `url`, `text`, `error`, `env`, `storage`), and a set of helpers of one kind is plural (`guards`, `collections`, `formatters`, `numbers`, `routes`); a hook of a topic goes in its `hooks/` folder.
- **Helpers of `shared/lib/`:** each folder is a topic with an `index.ts`, and a helper goes in the folder of its topic before any new file is added. Write a helper when code uses it already; a native feature or a library the project has comes first.

  | Folder | Holds | Not here, use instead |
  |---|---|---|
  | `guards/` | Checks of a value, in two files (`guards`, `presence`): `isRecord`, `isOneOf`, `isString`, `isBlank`, `isEmpty`, `hasText`, `assertPresent` | Parsing an unknown value: `zod` |
  | `collections/` | A copy of a map or a record with an entry set or dropped, and the comparison of two JSON-shaped values: `setEntry`, `removeEntry`, `omit`, `sameValue`; `groupBy` for the groups of a list in the order their keys first appear, with any value as a key, and `newestOfEachGroup` for the item of each group that ranks highest, such as the latest run of each thread | `pick`, `mapValues`, `shallowEqual`: `Object.fromEntries`, `useShallow` of zustand, or `es-toolkit` once five of them are needed |
  | `graph/` | How far some ids are from the start ids when each id leads to other ids, level by level, with a loop walked once, and the ids that each id leads to, from a list of edges: `distancesFrom`, `successorsFrom` | The items of one parent: `hierarchy/` |
  | `hierarchy/` | Items that sit one under another, read through a `Hierarchy` (how to get the id of an item and the id of its parent): `isNested`, `ancestorsOf`, `descendantsOf`, `toNested` | The hierarchy of one module: its entity gives the `Hierarchy` for its items, as `itemHierarchy` |
  | `text/` | How a text is matched, whatever its case and accents: `foldText`, `hasTextPart`; the palette scores its search with `foldText` too; where words sit in a text, and the text cut at those places for `Highlight`: `rangesOfQuery`, `splitByRanges` | How a text reads: `formatters/` |
  | `numbers/` | `clamp`, `decimalsOf`, `NumberLimits` | |
  | `formatters/` | How a number, a date and a length read, in the fixed locale `formatLocale`: `formatNumber`, `formatPercent`, `formatCurrency`, `formatDate`, `formatDateTime`, `formatDuration`, `formatRelativeTime`, and `initialsOf` for the initials of a name, `capitalize`, `snakeToSentenceCase` for a key such as `acceptance_criteria` as "Acceptance criteria", `jsonToPlainText` for a value of a content as one line of text | A month name or a time zone: `date-fns` |
  | `timing/` | `debounce`, `coalescedTask` for a task whose calls during a run share one more run after it, `sleep`, `useNow`, `actionToastDuration` | `throttle` and `retry` when a use appears (queries retry through `canRetryOnce` of `shared/api/query-client`); a time limit on a request: `AbortSignal.timeout` |
  | `clipboard/` | `useClipboard`, which copies a text and reports it for two seconds | The Clipboard API of the browser written in a component: the hook owns it |
  | `url/` | `pathOf`, `isAtOrUnder`, `encodeId`, `reloadTo`, `queryString`, `queryStringOf`, `pathWithQuery` | Parsing a query: `URLSearchParams`; the addresses of pages: `routes` |
  | `hotkey/` | Matching and writing a keyboard shortcut, and the name of the modifier key (`useModifierKeyName`) | |
  | `hydration/`, `viewport/` | `useIsHydrated` (false until the page hydrates), `useIsMobile` | |
  | `cn/` | `cn`, the class names of Tailwind (the alias `utils` of shadcn) | |
  | `registry/` | The items that components register while they are mounted, and leave with them: `createRegistryStore`, `useRegisterItem`, `useRegisteredItems`, `OrderedItem` (the status bar and the activity bar use it) | |
  | `storage/` | The browser storage (`browserStorage`, `storageKey`), and the storage of a persisted zustand store (`persistStorage`, `persistStorageByEntry`) with `parseStored` for a stored value checked by a schema; imported from `@/shared/lib/storage` only | Reading JSON by hand: `parseStored` |
  | `tone/`, `view/` | The tones of a status, the two views of the app | |

- **Dialogs:** every dialog, a confirm included, is mounted once, by a `...Dialogs` widget that each layout mounts (`ProjectDialogs` of `@/modules/project/widgets/dialogs`), and opened through a store of its feature that holds the id of what it acts on (`createPendingActionStore()` of `@/shared/lib/pending-action`, then `useOpenRenameProjectDialog()(projectId)`); the widget reads the data from the queries, so the store copies no server data, and forgets the id once the dialog has closed, after its animation (`onClosed`). The Stop dialog of the status works the same way: Stop and the palette open the one dialog beside the status.
- **Components:** function components, named exports, one exported component per file. Its small parts stay in the file as local functions; a part moves to its own file when it grows large or another file uses it. Next.js routing files (`page.tsx`, `layout.tsx`, `error.tsx`, ...) are the exception: they must use a default export. ESLint reports a default export anywhere else.
- **Words of the screens:** the developer view uses the words of the system, the screens for users the words of the user view. A value that a screen shows has both in its labels, as a `Wording` of `@/shared/lib/view`, one text per view; the nouns follow the table of [frontend README: Words of the screens](README.md#words-of-the-screens).
- **Routes stay thin:** `src/app/` holds only Next.js routing files. A `page.tsx` renders a component of a widget or a feature; the frame lives in `src/shared/components/frame/`, global providers in `src/providers/`.
- **Server and Client Components:** files in `src/app/` are Server Components by default. Add `'use client'` at the top of a component file that uses state, effects, event handlers, or browser APIs. Code that reads `window`, `document`, or `localStorage` runs in an effect or event handler, never during render, so the server-rendered HTML matches the first client render.
- **Server state** via TanStack Query only - don't copy server data into Zustand/`useState`.
- **Addresses of pages** come from `routes` of `@/shared/routes`, a factory grouped as the folders of `src/app/` are (`routes.login(next)`, `routes.settings()`); a page with an id gets a group that takes the id once. Code writes no path as a literal. Each leaf writes its whole path in one template given to `checkedRoute`, so that the route types check it, and query parameters take their names from `RouteParam`. An address that comes from data, such as a stored tab or a path in the address bar, is typed with `routeOfAddress`; no other code casts to `Route` (enforced by ESLint).
- **Query keys** come from the key factory of the resource, `<resource>.keys.ts` in the entities of its module: an object of functions from the widest key to the narrowest, each key starting with the one above (`userKeys.all()`, `userKeys.me()`). A query and every invalidation of it call the same function; no key is written as an inline array (enforced by ESLint outside the tests).
- **Query options:** a query used by one hook keeps its `queryFn` and options in that hook. A query that is also read or written elsewhere (`setQueryData`, `getQueryData`, `useQueries`, a prefetch) is defined once with `queryOptions` in `<resource>.queries.ts`, on a key of the key factory, and every use calls it, so that they share the key, the function and the type of the data.
- **Query states:** a component that shows data from a query handles four states, in this order: loading (`isPending`), error (`isError`), empty (success with no data), success. The first three use the shared components from `@/shared/components/state`:

  | State | Component | Rules |
  |---|---|---|
  | Loading | `LoadingState` | Skeleton rows roughly shaped like the content, with a `label` for screen readers; `columns` lines them up as the rows of a table. A spinner is only for short actions (a button that is submitting). |
  | Error | `ErrorState` | A message the user understands, plus `onRetry={() => void query.refetch()}`. The error stays where the data would be; it does not replace the page. |
  | Empty | `EmptyState` | Says what is missing and, when there is one, offers the next step through `action`. |

  - Each component has two sizes: `compact` for narrow containers (sidebar, cards) and `page` (default) for a panel or a whole page.
  - Queries use `useQuery`, not `useSuspenseQuery`: a suspended query would run on the server during rendering, where the API is not reachable with the user's session.
  - Unexpected errors (a bug while rendering) are caught by the route error boundary (`error.tsx`): the one of the folder of the page, `src/app/error.tsx` for what fails in a layout, and `src/app/global-error.tsx` for the root layout. An item that a component registers on the frame has a boundary of its own, so that it fails alone. Slow routes show a `loading.tsx`.
  - Every state must be reachable in `pnpm dev:mock` through a mock scenario (frontend README: Mock data).
- **Validation** with Zod at boundaries (forms, untrusted data).
- **Forms** use react-hook-form with a Zod schema in a `<form>.schema.ts`, as `new-project.schema.ts`, whose fields are named after the fields of the request. A field is a `TextField`, a `NumberField` (a number, with arrows and the keys that step it, shaped by `min`, `max`, `step` and `integer`; its value is a number or `undefined`, so a schema of `z.number()` says "required", and the schema still checks the limits on submit), a `FormField` around any other control, or a `FormFieldSet` around a group of controls that a legend names, such as checkboxes, from `@/shared/components/form`: they tie the label, `aria-invalid`, `data-invalid` and the error to the control. When the request fails, the hook of the mutation shows the problems of the API at their fields with `showFieldProblems` and the `setError` of the form, and gives the message for under the form with `formErrorOf`. A form that embeds the fields of a value object, such as the run settings, takes their schema from the entity of the object (`runDefaultsFieldsSchema`). The form is a `Form` from the same folder, which leaves the checks to the schema; the message under it is a `FieldError`, and the button that submits it a `PendingButton`. A form with nothing to check, such as the prompt of the project list or the filters of a list, has no schema and no react-hook-form: it is a plain `<form>`, whose submit handler calls `preventDefault` itself, since `Form` takes the handler that `handleSubmit` returns.
- **UI components:** use shadcn/ui primitives from `src/shared/components/ui/` before building custom ones. Style with Tailwind utilities; avoid ad-hoc CSS files. Use `cn()` from `@/shared/lib/cn` (re-exports shadcn's `cn` package, a clsx + tailwind-merge replacement) to combine classes. Outside `src/shared/components/ui/`, a class has no CSS value of its own in brackets (`text-[0.625rem]`, `grid-cols-[8rem_1fr]`, `[scrollbar-width:none]`; state selectors such as `data-[state=open]` are fine): use a token or utility of the scale, or add a token or `@utility` to `src/app/styles.css` (enforced by ESLint). A `style` prop is for a value that comes from data, such as the depth of a tree row.
- **Destructive actions:** an action that deletes, stops, revokes or discards something, ends the session, or cannot be undone asks first with `ConfirmDialog` of `src/shared/components/ui/confirm-dialog.tsx` (`destructive` makes the button red). Its title is a question that names the action, its description says what is lost and that it cannot be undone, and the button that confirms says the action (`Delete project`, not `OK`); the focus starts on Cancel. An action that returns a promise keeps the dialog open until it is done, and a failure leaves it open with the error in a toast. The dialog is a `*Dialog.tsx` file of the feature that owns the action, and it is the only file that calls the mutation hook (`useDelete*`, `useRemove*`, `useStop*`, `useRevoke*`, `useDiscard*`, `useReset*`; enforced by ESLint). Menus, rows, shortcuts and commands only open the dialog, through the store of the previous bullet, so an action asks the same way wherever it starts; the hook that registers the command (`useStopRunCommand`) is named `use...Command` and is the one hook of this kind that other files call. When the state does not allow the action, the dialog says why and offers the way out (a project with a run that is not finished is not deleted: the dialog says to stop the run first). An action that is easy to take back, such as archive, asks nothing and shows a toast with Undo (see Toasts). The tests of such an action call `itAsksBeforeAction` of `@/test/suites`, which covers: nothing runs while the dialog is open, nothing runs after Cancel or Escape, the action runs and the dialog closes after Confirm, and the dialog stays open when the action fails. A test with a flow of its own uses `findConfirmDialog`, `confirmAction`, `cancelAction` and `expectNoConfirmDialog` of `@/test/steps`.
- **HTTP and the environment:** the methods, statuses, headers and media types of HTTP come from `HttpMethod`, `HttpStatus`, `HttpHeader` and `MediaType` of `@/shared/api/http`, and an environment variable from `env` of `@/shared/config/env`; code writes none of the names of HTTP as a literal and reads no `process.env` (enforced by ESLint). A value that nothing checks by its type, such as a header, a media type or a status in `toBe(...)` or in a table of cases, is written with the constant in the tests too: `expect(answer.status).toBe(HttpStatus.Created)`. A method may be a literal in a test, since the function or the field that takes it has the type `HttpMethod`; the code outside the tests uses the name. The paths of the API come from `apiEndpoints` of `@/shared/api/endpoints`: the API functions send to `apiEndpoints.project.path({ projectId })`, the handlers of the mock server match `apiEndpoints.project.pattern`, and the tests use either, so no file writes `/api/v1/...` (enforced by ESLint, tests included; a test that needs a path of its own makes it with `apiEndpoint('/things/:id')`).
- **Toasts:** a toast with an action, such as Undo, passes `duration: actionToastDuration` of `src/shared/lib/timing/toast.constants.ts`, 10 seconds instead of the 4 of a toast without one, so that there is time to reach the action, also from the keyboard.
- **Heavy components** (CodeMirror, React Flow, PDF viewer) are lazy-loaded with `next/dynamic` (`ssr: false` for components that need the browser) so the initial bundle stays small.
- **Untrusted content** (LLM-generated HTML/Markdown) is never rendered with `dangerouslySetInnerHTML` (enforced by ESLint, except in the chart of shadcn/ui, which writes its colors into a style element); HTML artifacts go in a sandboxed iframe.
- **Accessibility:** semantic HTML, labels on inputs, keyboard navigable. `jsx-a11y` must pass, and the test of a page or of a dialog calls `expectNoAccessibilityViolations` of `@/test/steps`.
- Path alias: `@/` -> `src/`.

**File naming** (enforced by `eslint-plugin-check-file` in `pnpm lint`):

| File | Pattern | Examples |
|---|---|---|
| Component (`.tsx`) | `PascalCase.tsx`, name = the exported component | `ProjectListPage.tsx` |
| Hook (`.ts` in a `hooks/` folder, or alone at the root of a feature or a widget) | `useSomething.ts`, name = the exported hook; `use<Resource>Queries.ts` for the hooks that read a resource of the API (see Hooks of a slice). A React context goes in the file of the hook that reads it, and the component that provides it imports it from there | `useRunStream.ts`, `useProjectQueries.ts`, `useView.ts` (with `ViewContext`) |
| Any other `.ts` | `<subject>.<kind>.ts` | `projects.api.ts`, `settings.store.ts`, `run-events.reducer.ts` |
| Config that holds React elements (`.tsx`) | `<subject>.config.tsx` | `activity-frame.config.tsx` |
| Unit test | `<file under test>.test.ts(x)`, in a `__tests__/` folder next to the file under test | `modules/user/entities/__tests__/user.api.test.ts`, `shared/components/state/__tests__/ErrorState.test.tsx` |
| Cases of a data-driven unit test | `<file under test>.data.ts`, beside its test | `shared/api/error/__tests__/api-error.utils.data.ts` |
| E2E test | `<subject>.spec.ts`, in a folder per feature | `tests/e2e/projects/projects.spec.ts` |
| Screenshot spec (each state is a test that calls `shoot()`) | `<page>.spec.ts`, in a folder per feature | `tests/screenshots/projects/project-list.spec.ts` |
| Cases of an E2E test | `<subject>.data.ts`, beside its spec | `tests/e2e/projects/projects.data.ts` |
| Steps and values that E2E tests and screenshot specs share | `<subject>.utils.ts` or `<subject>.constants.ts`, under `tests/shared/` (`steps/` for the steps, used through its `index.ts`: typing, pressing, and the `expect*` checks of the page; an E2E spec takes `test` from `tests/shared/fixtures.utils.ts` and calls them as `user.pressButton(...)`, bound to its page) | `tests/shared/steps/form.utils.ts`, `tests/shared/steps/keyboard.utils.ts`, `tests/shared/accounts.constants.ts` |

- **Subject** (before the first dot): what the file is about, in kebab-case; in a slice, a resource or a topic (see Files of a slice). Always include it, even when the folder already says it (`modules/project/entities/projects/projects.api.ts`), so names are unique in search results and editor tabs.
- **Kind** (after the dot): the role of the file, one of `api`, `keys`, `queries`, `types`, `schema`, `store`, `reducer`, `config`, `constants`, `utils`, `handlers`, `fixtures`, `lookup`, `changes`, `problems`, `validators`, `setup`, `spec`. Each place of `src/` holds only some of them, as `fileKinds` of `lint/lib/file-names/file-kinds.constants.js` lists and [Web App Modules: Kinds of file in a slice](../docs/architecture/web-app-modules.md#3-kinds-of-file-in-a-slice) explains. Need a new kind? Add it to the list here and in `lint/lib/file-names/file-kinds.constants.js` in the same PR.
- **Exceptions** (names set by a tool or convention): `src/shared/components/ui/**` (shadcn CLI), Next.js file conventions (below), `index.ts` barrels, the files of an `@x/` folder, named after the entity that uses them, `*.d.ts`, and root config files (`next.config.ts`, ...).
- **Next.js file conventions** keep the names the framework requires:
  - Routing files in `src/app/**`: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `template.tsx`, `default.tsx`, `route.ts`.
  - Metadata files in `src/app/**`: `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`.
  - Entry points directly in `src/`: `proxy.ts`, `instrumentation.ts`, `instrumentation-client.ts`.
  - Any other file placed in `src/app/**` follows the table above.

**Folder naming** (enforced by the same plugin):

| Folder | Pattern | Examples |
|---|---|---|
| Inside `src/app/` (route segments) | kebab-case segment, or a Next.js form: `(group)`, `[param]`, `[...param]`, `[[...param]]`, `_private`, `@slot` | `settings/`, `(home)/`, `projects/[projectId]/` |
| Everywhere else in `src/` and `tests/` | kebab-case, `__tests__` for unit tests, or `@x` for the files that an entity gives other entities | `modules/project/features/rename/`, `shared/components/`, `modules/run/entities/steps/__tests__/`, `modules/run/entities/@x/` |

A folder name in `src/app/` is a URL segment, so renaming it changes the URL.

**Identifier naming:**

| Identifier | Pattern | Examples |
|---|---|---|
| Component, type, interface, React context | PascalCase | `ProjectListPage`, `RunStatus`, `TabGroupContext` |
| Object of named values used as an enum (`as const`, often with a type of the same name), and its keys | PascalCase | `HttpStatus.NotFound`, `ApiErrorCode.VersionConflict`, `PanelRegion.Side` |
| Hook | camelCase, starting with `use` | `useMe`, `useRunStream` |
| Any other function or variable, and any other value that a file exports, constants included | camelCase | `projectName`, `meSchema`, `actionToastDuration`, `runStatusLabels` |
| Setting private to its file, at its top level: a number or a word that tunes the file, such as a page size, a delay or a limit | UPPER_SNAKE_CASE | `PAGE_SIZE`, `ME_STALE_TIME`, `RECENT_COUNT` |

A setting that another file needs is exported, and so becomes camelCase: `ME_STALE_TIME` would be `meStaleTime`. ESLint reports an exported value in UPPER_SNAKE_CASE; the case of a private setting stays a convention, since ESLint cannot tell a setting from a schema or from sample data.

## Checklist for a new part

What to check on the diff before it is reviewed, and what a reviewer checks again. It covers `src/`, `src/mocks/` and `src/test/` alike. The rules that a tool can check are in ESLint; this list is for the rest. Where a point fails, fix it in the same PR, except a move, which goes in its own PR (root CONTRIBUTING).

**Names**
- **No ambiguity.** Read the name alone, without the file: if it allows a second meaning, rename it. Three ways it goes wrong:
  - One name for two things: `problem` for a field problem and for an error response, `search` for what the user types and for the query of an address, `item` for an item of the artifact and an item of a menu. Rename one of them (`FieldProblem` and `errorResponse`; `query` for the address).
  - Two names for one thing, or two names that differ by a hair for two things: `login` in one place and sign in in another; `find` and `get`, `fixture` and `mock`, with no rule that tells them apart. One concept has one word in the whole app, and a pair of similar names is told apart by the name itself.
  - A word too general to say anything: `data`, `info`, `handle`, `manager`, `helper`, `common`, `utils` for a file of several topics. Add what it is about (`allowedValues`, `query-string.utils.ts`). ESLint reports a variable, a parameter or a function named `data`, `info`, `tmp`, `temp`, `obj`, `arr`, `val`, `res`, `resp`, `req`, `cb`, `fn`, `ctx`, `msg`, `btn`, `el`, `elem` or `handle...` (an event handler is named after what it does: `submitOnEnter`), and a type named `Props` alone (`<Component>Props`); a destructured name keeps the name of the field.
- A name matches the barrel it is exported from (a file of `@/shared/lib/text` is about text), and a function whose name hides a side effect or a failure says it (`assertPresent` throws, `readBodyFields` never does).
- A boolean starts with `is`, `has` or `can`, and so does a function that returns one, a variable and a parameter (a hook with `use` is the exception; a destructured name and a callback written in place keep the name they are given; enforced by ESLint with `lint/plugin/boolean-name.js`); `find...` may come back empty (`null` or `undefined`) and `get...` always gives a value or throws (`lint/plugin/find-get-name.js`, off in the helpers of the tests, where `find...` waits and throws as `findBy...` does); a name does not use a word that the app dropped, such as sign in, sign out, sign up or create account for log in, log out and register (`lint/plugin/retired-words.js`); a conversion with `to`; a function that reads a value from unknown data with the name of the value (`positiveInteger`); a hook with `use`.
- A comment says what holds, or why, at the place where it stands. It does not cite another layer as its authority, a requirement id or a path of the docs.

**Duplication**
- Search before writing: the same condition by hand (`isString(x) && hasText(x)`), the same JSX block, the same steps in two tests, the same cases in two `.data.ts`. The places to look first are `@/shared/lib`, `@/shared/components`, `src/mocks/shared` and `src/test`.
- Two copies are a warning, three are a helper. A helper states one idea in its name, sits in the lowest layer that all its callers can import, and has a test of its own. Do not extract by size alone.
- When the first user is in another slice, the second user does not copy it: the helper moves down to the layer both can import, then both use it.

**Readability**
- A function works at one level and returns early instead of nesting; a boolean argument that switches the behavior becomes two functions or a named option.
- A value with a meaning has a name (a status, a keyword, a delay), and a list of values with a type is declared once (Types and constants).
- A file longer than about 200 lines is checked for two topics; a function that needs a comment per block is checked for the names of those blocks.

**Cohesion of a folder**
- By meaning: the name of the folder describes every file in it, and a file that needs "and" to be described belongs elsewhere.
- By use: the files of a folder are used together or change together. A file that one place uses sits beside that place; one that several slices use goes down a level (slice, entities of the module, `shared`).
- More than about five files with different topics become folders by topic, each with an `index.ts` that exports only what others use.

**Layers**
- Imports go down: `app`, then the modules (widgets, features, entities), then `shared`; the module lists in `lint/lib/modules/module-imports.constants.js` say which module may read which. Inside `src/mocks` a file reads its own kind or a kind below it (fixtures, store, lookup, changes, problems, validators, handlers).
- I/O is in `*.api.ts`, React in hooks and components, rules of data in `*.utils.ts`. Untrusted data is parsed once, at the boundary.
- Nothing in `shared` knows a module, and nothing in an entity knows a screen.

**Placement**
- Ask who imports the file: one slice (inside it), several slices of a module (its entities), several modules (`shared`), only tests (`src/test`), only the mocks (`src/mocks/shared`). A new folder has a singular topic name, and a row in the README or here when it opens a new place.
- Moves and renames go in their own PR.

**Screens**
- A query shows its four states; a form shows the problems at its fields; a destructive action asks first (Destructive actions); a control has a label and works with the keyboard.

**Tests**
- Test the behavior from the public seam: the component or the hook, with the mock server. Each branch and each failure (404, 500, an empty list) has a case, and the cases that share a flow are a table in a `.data.ts`.
- A new mock handler has a test of its own; a new reader or helper has cases for the values that it refuses.
- The steps that two tests share are a helper of `src/test` (see below).

**Rules and docs**
- A new place, script or rule is written in the README or in this file in the same PR. A mistake that could be made again becomes an ESLint rule or a test, not only a sentence.

**Reuse before writing.** These are the helpers that most new work needs:

| Need | Use |
|---|---|
| An id, a time or a stored record in a mock | `mockId`, `createdId`, `mockNow`, `msSince`, `mockState` of `@/mocks/shared/db` |
| A page of a list, an answer by its status, an error answer | `paginate`, `emptyPage`, `created`, `accepted`, `noContent`, `emptyResponse(HttpStatus.Conflict)`, `notFound`, `validationFailed`, `errorResponse` of `@/mocks/shared/http/response`; the other answers are `HttpResponse.json(...)` of MSW |
| A field of a request body | `readBodyFields`, and the readers `optionalText`, `requiredText`, `positiveInteger`, `choice`, `jsonObject`, `jsonBoolean` of `@/mocks/shared/http/validation`, each with its `...Problem` |
| A request that must not do its work twice | `idempotent` of `@/mocks/shared/http/request` |
| A parameter of the path that a handler matched, such as `projectId` | `pathParam(params, 'projectId')` of `@/mocks/shared/http/request` |
| A state of the screen chosen in the address | `answerScenario`, `pageUrlParam` of `@/mocks/shared/scenario` |
| Rendering a component or a hook with its providers | `renderWithProviders`, `renderHookWithProviders` of `@/test/render` |
| Rendering the frame with what a slice contributes to it (a status bar item, commands, dialogs), to read them where the frame shows them | `renderWorkbench` of `@/test/render`, with `rerenderContributions` to change or take them off; then `statusBar()` and `openCommandPalette()` of `@/test/steps` |
| The path of an endpoint of the API, in an API function, a handler or a test | `apiEndpoints.<name>.path(...)` or `.pattern` of `@/shared/api/endpoints` |
| A request to the mock server (a text body goes as it is, any other as JSON) | `fetchApi`, `callApi`, `getApi`, `postApi`, `putApi`, `patchApi`, `deleteApi`, `openPage` of `@/test/msw` |
| A server error for one method and path | `serverErrorOn(HttpMethod.Delete, '/api/v1/projects/:projectId')`, or `serverError()` in a handler of its own, of `@/test/msw` |
| The same cases for an `*.api.ts` file: the request it sends, the `ApiError` it throws when the server refuses | `itSendsRequests`, `itThrowsApiErrors` of `@/test/suites` |
| The router, and the path and the query of a page | `routerMock`, `setPathname`, `setQuery` of `@/test/next-stubs` |
| A request that the test keeps unanswered, to look at the page meanwhile; a call that never answers | `holdResponse` of `@/test/msw`; `expectStillPending` of `@/test/steps` |
| The query keys of a `*.keys.ts` file: each starts with the key above it, and keys that stand for different data differ | `itNestsQueryKeys`, `itTellsQueryKeysApart` of `@/test/suites` |
| A mock that has to be called | `waitForCall` of `@/test/steps` |
| A query, or several, that has to load | `waitForSuccess`, `waitForQueries` of `@/test/steps` |
| Typing in a form, pasting, pressing a button, a menu item or another control, a key, Tab, Escape | `fillFields`, `replaceText`, `typeText`, `pasteText`, `pressButton`, `pressMenuItem`, `pressRole`, `pressKey`, `pressKeys`, `pressTab`, `pressEscape` of `@/test/steps`; a test never calls `userEvent.keyboard`, `type`, `paste` or `tab` itself (`clickHolding` clicks while a key is held), and never makes a `QueryClient` (`createTestQueryClient` of `@/test/render`, or `renderWithProviders(ui, { queryClient })` to look at the cache); both enforced by ESLint |
| A toast to read | `spyOnToast` of `@/test/steps` |
| The page that the router was sent to | `expectPushedTo`, `expectReplacedWith` of `@/test/steps` |
| What shows on the screen: an alert, a text, a label, a control of a role and name, whether it is disabled or has the focus, a field marked invalid | `expectAlert`, `expectText`, `expectNoText`, `expectLabel`, `expectRole`, `expectNoRole`, `expectLink`, `expectAttribute`, `expectFieldValue`, `expectDisabled`, `expectEnabled`, `expectFocused`, `expectInvalidField`, `expectValidField` of `@/test/steps` |
| What assistive technology can read | `expectNoAccessibilityViolations` of `@/test/steps` (axe, without the rules that jsdom cannot answer) |
| A form that refuses fields and sends nothing | `itAsksForFieldsBeforeSending` of `@/test/suites` |
| The states of the query behind a screen | `itShowsQueryStates` of `@/test/suites` |
| The toast that an action shows when it ends | `itToastsOnResult` of `@/test/suites` |
| Requests that the mock server rejects with an error (404, 422, a scenario of error) | `itRejectsRequests` of `@/test/suites` |
| The tests of an action that asks before it runs | `itAsksBeforeAction` of `@/test/suites` (and `findConfirmDialog`, `confirmAction`, `cancelAction`, `expectNoConfirmDialog` of `@/test/steps` for a flow of its own) |

The list draws on the smells of Fowler (Refactoring), the deep modules of Ousterhout (A Philosophy of Software Design), the layers of Feature-Sliced Design, the guiding principles of Testing Library, and the guidance on confirmation and Undo of the Nielsen Norman Group.

## Logging & Errors

- Frontend: use an error boundary per route; no `console.log` left in committed code (ESLint `no-console`).

## Testing

- **Frontend:** Vitest + Testing Library; test behavior, not implementation. Mock HTTP with MSW. The helpers of the unit tests are in `src/test/`, a folder for each topic (`msw/`, `suites/`, `next-stubs/`, `render/`, `steps/`, `event-source/` for the stand-in of `EventSource` that jsdom lacks), and a test imports them from the index of the folder, such as `@/test/msw` (enforced by ESLint). The setup of Vitest does what every test needs and puts everything back after each test, so a test does not repeat it: `next/navigation` and `next/link` are the stand-ins of `@/test/next-stubs`, the page address, the mock server (handlers, listeners and records of the mock data), the stores of zustand, the fake timers (`vi.useFakeTimers`, the environment and the globals set with `vi.stubEnv` and `vi.stubGlobal`) and the calls and spies of the mocks start fresh. A test sets only what it needs, such as `setPathname('/projects/p1/console')`. The CI runs the tests with coverage and posts the numbers on the pull request; no minimum is checked.
- **Data-driven tests:** cases that share one flow and differ only in their data are one `it.each` over a table of cases, and the table lives in `<file under test>.data.ts` beside the test. A test with its own flow stays a plain `it`. The Playwright tests (E2E and screenshots) follow the same rule: a flow that takes several cases runs over a table of them in the `.data.ts` beside the spec, one `test` per case, and a flow of its own stays a plain `test`.
- **E2E:** Playwright for critical flows only.
- Test file naming: `<Component>.test.tsx`. Frontend unit tests live in a `__tests__/` folder next to the file under test, never beside it (enforced by ESLint).
