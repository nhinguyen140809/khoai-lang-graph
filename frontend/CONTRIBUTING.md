  | `text/` | How a text is matched, whatever its case and accents: `foldText`, `hasTextPart`; the palette scores its search with `foldText` too; where words sit in a text, and the text cut at those places for `Highlight`: `rangesOfQuery`, `splitByRanges`; how values, keys and names read: `capitalize`, `snakeToSentenceCase` for a key such as `acceptance_criteria` as "Acceptance criteria", `initialsOf` for the initials of a name, `jsonToPlainText` for a value of a content as one line of text; the first line that holds text (`firstLineOf`), the plural of a word for a count (`pluralForm`), and the parts that hold text joined (`joinPresent`) | A month name or a time zone: `date-fns` |
  | `numbers/` | `clamp`, `decimalsOf`, `NumberLimits`; how a number reads in the fixed locale of `shared/config/locale`: `formatNumber`, `formatPercent`, `formatCurrency` | |
  | `time/` | How a date and a length read: `formatDate`, `formatDateTime`, `formatDuration`, `formatRelativeTime`; the time between two dates (`msBetween`), a duration rounded to whole minutes for words (`roundedDuration`), `minuteMs` and `useNow` | A month name or a time zone: `date-fns` |
  | `scheduling/` | `debounce`, `coalescedTask` for a task whose calls during a run share one more run after it, `useCoalescedListener` for the signals of a stream that coalesce into such a task, `sleep` | `throttle` and `retry` when a use appears (queries retry through `canRetryOnce` of `shared/api/query-client`); a time limit on a request: `AbortSignal.timeout` |
  | `idle-visibility/` | `useIdleVisibility` for a floating control that hides while the user rests, with the events that show it and the props that hold it | |
  | `clipboard/` | `useClipboard`, which copies a text and reports it for two seconds | The Clipboard API of the browser written in a component: the hook owns it |
  | `url/` | `pathOf`, `isAtOrUnder`, `encodeId`, `reloadTo`, `queryString`, `queryStringOf`, `pathWithQuery` | Parsing a query: `URLSearchParams`; the addresses of pages: `routes` |
  | `hotkey/` | Matching and writing a keyboard shortcut, and the name of the modifier key (`useModifierKeyName`); whether a key sends a prompt (`isSubmitKey`) | |
  | `hydration/`, `viewport/` | `useIsHydrated` (false until the page hydrates), `useIsMobile`, `useScrollIntoView` (the element in view again on each key change) | |
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
- **Toasts:** a toast with an action, such as Undo, passes `duration: actionToastDuration` of `src/shared/components/ui/sonner.tsx`, 10 seconds instead of the 4 of a toast without one, so that there is time to reach the action, also from the keyboard.
- **Heavy components** (CodeMirror, React Flow, PDF viewer) are lazy-loaded with `next/dynamic` (`ssr: false` for components that need the browser) so the initial bundle stays small.
- **Untrusted content** (LLM-generated HTML/Markdown) is never rendered with `dangerouslySetInnerHTML` (enforced by ESLint, except in the chart of shadcn/ui, which writes its colors into a style element); HTML artifacts go in a sandboxed iframe.
- **Accessibility:** semantic HTML, labels on inputs, keyboard navigable. `jsx-a11y` must pass, and the test of a page or of a dialog calls `expectNoAccessibilityViolations` of `@/test/steps`.
- Path alias: `@/` -> `src/`.

**File naming** (enforced by `eslint-plugin-check-file` in `pnpm lint`):

| File | Pattern | Examples |
|---|---|---|
| Component (`.tsx`) | `PascalCase.tsx`, name = the exported component | `ProjectListPage.tsx` |
| Hook (`.ts` in a `hooks/` folder, or alone at the root of a feature or a widget) | `useSomething.ts`, name = the exported hook; `use<Resource>Queries.ts` for the hooks that read a resource of the API (see Hooks of a slice). A React context goes in the file of the hook that reads it, and the component that provides it imports it from there | `useRunStatusEvents.ts`, `useProjectQueries.ts`, `useView.ts` (with `ViewContext`) |
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
| Hook | camelCase, starting with `use` | `useMe`, `useRunStatusEvents` |
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
- Code without business is shared code from its first user (Placement). For code with business, two copies are a warning, three are a helper. A helper states one idea in its name, sits in the lowest layer that all its callers can import, and has a test of its own. Do not extract by size alone.
- When the first user is in another slice, the second user does not copy it: the helper moves down to the layer both can import, then both use it.

**Readability**
- A function works at one level and returns early instead of nesting; a boolean argument that switches the behavior becomes two functions or a named option.
- A value with a meaning has a name (a status, a keyword, a delay), and a list of values with a type is declared once (Types and constants).
- A file longer than about 200 lines is checked for two topics; a function that needs a comment per block is checked for the names of those blocks.

**Cohesion of a folder**
- By meaning: the name of the folder describes every file in it, and a file that needs "and" to be described belongs elsewhere.
- By use: the files of a folder are used together or change together. A file with business that one place uses sits beside that place; one that several slices use goes down a level (slice, entities of the module). A file without business sits in `shared` (Placement).
- More than about five files with different topics become folders by topic, each with an `index.ts` that exports only what others use.

**Layers**
- Imports go down: `app`, then the modules (widgets, features, entities), then `shared`; the module lists in `lint/lib/modules/module-imports.constants.js` say which module may read which. Inside `src/mocks` a file reads its own kind or a kind below it (fixtures, store, lookup, changes, problems, validators, handlers).
- I/O is in `*.api.ts`, React in hooks and components, rules of data in `*.utils.ts`. Untrusted data is parsed once, at the boundary.
- Nothing in `shared` knows a module, and nothing in an entity knows a screen.

**Placement**
- First ask whether the file holds business: whether it reads or decides anything about an object of the product. A file that does not (a duration in words, the key that sends a prompt, the scroll of an element into view, the width of a dialog, a listener that coalesces the signals of a stream) goes to `shared` from its first user, whatever the count of its users. A mechanism inside a rule of the product splits: the mechanism to `shared`, the rule in the module of its object (the stream of a run: which stream, which events and when to listen stay in `run`; the listener goes to `shared/lib/scheduling`).
- Then ask who imports a file with business: one slice (inside it), several slices of a module (its entities), several modules (the entities of the module of its object, which the others read through `@x`), only tests (`src/test`), only the mocks (`src/mocks/shared`). A new folder has a singular topic name, and a row in the README or here when it opens a new place.
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
