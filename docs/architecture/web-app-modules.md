# Web App Modules

How the code of the web app is divided: by module first, then by the layers of Feature-Sliced Design inside each module, then by kind of file inside each slice. Which objects, actions and blocks of the product each module holds, and which ones are still planned.

The objects come from [Data Shape](../DATA_SHAPE.md), the endpoints from [API design: resource map](../API.md#4-resource-map), and the files of the workflow graph, the reviews and the artifacts from [Web App: files](web-app.md#9-files).

## Contents

- [Web App Modules](#web-app-modules)
  - [Contents](#contents)
  - [1. Structure](#1-structure)
  - [2. Layers inside a module](#2-layers-inside-a-module)
  - [3. Kinds of file in a slice](#3-kinds-of-file-in-a-slice)
  - [4. Order of the modules](#4-order-of-the-modules)
  - [5. Imports](#5-imports)
  - [6. Modules](#6-modules)
  - [7. Objects without an entity](#7-objects-without-an-entity)
  - [8. Shared code](#8-shared-code)
  - [9. Blocks that read several modules](#9-blocks-that-read-several-modules)
  - [10. Review checklist](#10-review-checklist)

---

## 1. Structure

- **Level 1, the module** (`src/modules/<module>/`): all the code of one subject of the product, its objects, its actions and its blocks, so that a change to a subject opens one folder.
- **Level 2, the layers** of Feature-Sliced Design inside a module: one slice of entities (`entities/`), one slice for each feature (`features/<feature>/`) and one for each widget (`widgets/<widget>/`).
- **Level 3, the kinds of file** inside a slice: `components/`, `hooks/`, `types/`, `constants/`, `utils/` and the other kinds of the contributing guide. A kind gets a folder once it has two files or more; a kind with one file stays at the root of the slice.
- `src/shared/` and `src/app/`, with `src/providers/`, stay outside the modules.
- Activity is a feature of the activity bar, as Documents or Workflow are, and a module of its own, `activity`. Its side panel shows the stages of the workflow as a tree, in the order of the definition, marked as the events of the run arrive: the widget `steps`, with the item of the feature on the activity bar, not built yet. Its page, which opens in a tab, is the chat: the widget `chat`. Until it is rebuilt, the route of its page shows a placeholder, and `chat` holds the code of the first chat, with the events of the stream of a run and their reducer in `run/entities` and the action that starts a run with an input in `run/features/start`. The rebuilt chat sends a message instead, from `thread/features/send-message`.
- Three modules hold no object of the product yet: `artifact` holds the placeholder of the artifact panel (`artifact/widgets/panel`), `user` the settings page (`user/widgets/settings`), with the feature that chooses the theme (`user/features/theme`), and `design-system` the page that shows the UI components and the tokens (`design-system/widgets/showcase`).

```text
src/
├── app/                        # routes, layouts, providers; they place the widgets of a screen
├── modules/
│   ├── artifact/
│   │   └── widgets/            # panel/, a placeholder
│   ├── run/
│   │   ├── entities/
│   │   │   ├── @x/             # the files for the entities of other modules: project.ts, thread.ts
│   │   │   ├── components/     # RunStatusBadge
│   │   │   ├── constants/
│   │   │   ├── hooks/          # useRunStream.ts
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── run-events.reducer.ts
│   │   │   ├── runs.api.ts
│   │   │   └── index.ts
│   │   └── features/           # start/
│   ├── thread/
│   │   └── entities/           # Thread
│   ├── project/
│   │   ├── entities/           # Project
│   │   ├── features/           # create/, rename/, archive/, delete/
│   │   └── widgets/            # list/, menu/, commands/, dialogs/
│   ├── activity/
│   │   └── widgets/            # chat/; steps/ later
│   ├── auth/
│   │   ├── entities/           # the calls that start and end a session
│   │   └── features/           # sign-in/, sign-up/, sign-out/
│   ├── user/
│   │   ├── entities/           # User
│   │   ├── features/           # theme/
│   │   └── widgets/            # menu/, settings/
│   └── design-system/
│       └── widgets/            # showcase/
└── shared/                     # api/, components/ (ui/, frame/ with frame/layouts/, ...), hooks/,
                                # lib/ (view/, tone/, formatters/), config/ (routes/, output-language/)
```

Dividing by module first keeps a subject in one folder. In exchange, the modules keep an order between them ([section 4](#4-order-of-the-modules)), and the linter of Feature-Sliced Design (Steiger), which expects the layers first, does not apply; the rules are the ESLint rules of the repository.

## 2. Layers inside a module

| Layer | Holds | May import |
|---|---|---|
| Entities | One slice: the objects of the module, how the web app reads them and shows them | Shared code, and the entities of a module under its own through their `@x/` file |
| Features | One slice for each action of the user that changes something: send a message, stop a run, rename a project | The entities of its module and of the modules under it, and shared code |
| Widgets | One slice for each block of the screens that puts objects next to actions, or several actions together | The features and the entities of its module and of the modules under it, and shared code |

- An **entity** holds what several slices need to read its objects: the schema and the types of the responses, the functions that call the endpoints, the query keys, the query hooks, the pure helpers, and the small components that show an object, such as the badge of a run status. It holds the functions of every endpoint of its objects, the ones that change them too, so that all their query keys sit in one place and a feature invalidates exactly the queries it changes.
- A **feature** holds one action of the user: the mutation hook, the form or the dialog, and the rules of the action, such as which run Stop stops. Such a rule stays in the feature even when it is core to the product: what decides is object or action, not how central the code is.
- A **widget** holds a block that puts objects next to actions, such as the status of a project with Stop. It adds no rule of its own: reading stays in the entities and the actions in the features. The widget places them, connects them, for example by giving the run on screen to both, and keeps only the state of the block, such as the tab that is open.
- A block that is not a widget goes where its content is: a block of one object to its entity, a block of one action to its feature, a block with neither object nor action to shared code. An entity never shows an action, since a lower layer does not import a higher one.
- An object that only one feature reads stays in that feature until a second slice reads it.

## 3. Kinds of file in a slice

A slice holds its components in `components/`, its hooks in `hooks/`, and its other files as `<subject>.<kind>.ts`. A kind with two files or more gets a folder named after it in the plural, such as `types/` or `stores/`. The unit tests sit in a `__tests__/` folder beside the files they test: `<file>.test.ts(x)`, with the cases of a data-driven test in `<file>.data.ts`. Every slice has an `index.ts`.

| Kind | File | Entities | Features | Widgets |
|---|---|---|---|---|
| Component | `components/PascalCase.tsx` | The small components that show an object (`RunStatusBadge`) | The form, the dialog or the button of the action | The block |
| Hook | `hooks/useSomething.ts` | The queries (`use<Resource>Queries.ts`) and the streams | The mutations, and the hooks of a store | The hooks of the block (`useChat`) |
| `api` | `<resource>.api.ts` | The calls of the endpoints of the objects | - | - |
| `keys` | `<resource>.keys.ts` | The query keys | - | - |
| `queries` | `<resource>.queries.ts` | A query that several places read or write | - | - |
| `types` | `<subject>.types.ts` | The schemas and the types of the responses, and the lists of values that a type is made from | The types of the action | The types of the block |
| `schema` | `<form>.schema.ts` | - | The schema of a form | - |
| `store` | `<topic>.store.ts` | - | The state of a dialog or of a prompt | The state of the block |
| `reducer` | `<topic>.reducer.ts` | The events of a stream | A state that events change | A state that events change |
| `constants` | `<topic>.constants.ts` | The labels and the looks of the values, and the defaults | The words of the action | The words of the block |
| `utils` | `<topic>.utils.ts` | The pure rules of the objects | The rules of the action | The pure helpers of the block |
| `fixtures` | `<subject>.fixtures.ts` | - | - | Sample data, as in the design system page |
| `@x/` | `<module>.ts` | The files for the entities of other modules | - | - |

Outside the modules, shared code holds `types`, `store`, `reducer`, `config`, `constants` and `utils` files; `src/mocks/` holds `types`, `store`, `constants`, `utils`, `handlers`, `fixtures` and `setup` files, its `fixtures` the records of the mock data and its `constants` their fixed ids and counts; `src/test/` holds `utils` and `setup` files; and `tests/` holds the `spec`, `data` and `utils` files of Playwright. A config made of React elements is a `<subject>.config.tsx`.

ESLint checks the kinds of each place (`FILE_KINDS` of `frontend/eslint.config.js`), the layers inside a module, and the folders at the root of a slice: one for each kind that the layer holds, `components/`, `hooks/`, `__tests__/`, and `@x/` in the entities. It also checks that a `constants` file exports no type and declares no function, and that a `types` file imports no `constants` file.

## 4. Order of the modules

`workflow`, `artifact` -> `run` -> `review` -> `thread` -> `project`, `activity`

`auth` -> `user`

`usage`, `design-system`

A module imports only the modules under it in its line: `project` reads `thread` and `run`; `activity` sits beside `project`, so it may read the same modules, and neither of the two reads the other; `thread` reads `run`, and `user` reads `auth`. `usage` and `design-system` read no other module. The order is `MODULE_IMPORTS` of `frontend/eslint.config.js`, which lists the modules of today and the ones planned next; a new module gets its place there before its first code. ESLint does not load when the lists form a cycle, or name a module that has no list.

`itemRefSchema`, the reference to an item that a step produced or a message names, sits in `run` until the module `artifact` exists.

## 5. Imports

| From | May import | How |
|---|---|---|
| The entities of module A | The entities of a module B under A | `@/modules/B/entities/@x/A` |
| A feature | The entities of its module and of the modules under it | `@/modules/<module>/entities` |
| A widget | The features and the entities of its module and of the modules under it | `@/modules/<module>/features/<feature>`, `@/modules/<module>/entities` |
| The app layer | Every slice | Its `index.ts` |
| Shared code | Shared code only | - |

Still forbidden, and reported by ESLint:

- A feature that imports another feature, also of its own module.
- A widget that imports another widget.
- A layer that imports a layer above it.
- A module that imports a module above it, or one outside its line.
- An import of a file inside a slice: code outside the slice uses its `index.ts`, and code inside it relative imports.

The `@x` folder is for two entities, which sit in the same layer; an import to a lower layer uses the `index.ts` of the slice. The entity that is used adds `@x/<module that uses it>.ts`, which exports only what that module may use:

```text
modules/
├── run/
│   └── entities/
│       ├── index.ts            for the features, the widgets and the app
│       └── @x/
│           └── project.ts      for modules/project/entities only
└── project/
    └── entities/
        └── types/
            └── projects.types.ts   imports from '@/modules/run/entities/@x/project'
```

```ts
// modules/run/entities/@x/project.ts
export { runDefaultsSchema } from '../types/run-config.types'
export { type RunStatus, runStatuses } from '../types/run-status.types'
```

The links between entities today:

| Entity that uses | Entity used | What it takes |
|---|---|---|
| `project` | `run` | The run statuses |
| `thread` | `run` | The unfinished run statuses |

A unit test may also import another slice of its layer, from its index, to show slices together, such as the project table with the dialogs that its rows open.

## 6. Modules

| Module | Entities | Features | Widgets | State |
|---|---|---|---|---|
| `workflow` | Workflow definition (graph, agent roles, stages in their order, checkpoints and their options), workflow state | - | - | Next |
| `artifact` | Artifact, ArtifactItem and their revisions; artifact kinds and content schemas | `edit` | `panel` | The placeholder of `panel` today; the rest with the documents |
| `run` | Run and RunStep, each with its usage; RunEvent, Directive, the event stream of a run; the run statuses and their badge | `stop`, `start` (the first chat); `retry` later | `graph`, the workflow graph of a run, later | The run statuses, the stream of a run and `start` today |
| `review` | Interrupt, HumanDecision | `answer` | `panel` | With the activity |
| `thread` | Thread, Message | `send-message` | - | The threads today; `send-message` with the activity |
| `project` | Project, the run that its status shows, the streams of its runs | `create`, `rename`, `archive` (with restore and Undo), `delete` | `list`, `menu`, `commands`, `dialogs`, `status` | Today, except `status` and the runs in the entities, which come with the threads |
| `activity` | ActivityEvent later, the record of who did what in a project | - | `steps`, the stages of the workflow as a tree in the side panel of Activity, with the item of the feature on the activity bar; `chat`, the chat in its tab | The chat of the first version today; the rest with the activity |
| `auth` | The calls that start a session, create an account and end a session; the page that opens after signing in | `sign-in`, `sign-up`, `sign-out` | - | Today |
| `user` | User, UserSettings | - | `menu`, `settings` | User, `menu` and `settings` today |
| `usage` | Usage of the user in a calendar month, with the budget of the month | - | - | Next |
| `trace-link` | TraceLink, the traceability views | - | - | Later |
| `llm-model` | ModelCatalogEntry, ModelSettings | - | - | Later |
| `design-system` | - | - | `showcase`, the page of the UI components and the tokens | Today |

The endpoints of the entities:

| Module | Endpoints |
|---|---|
| `workflow` | `/workflow/definition`, `/runs/{run_id}/state`, `/runs/{run_id}/steps/{step_id}/state` |
| `artifact` | `/projects/{project_id}/artifacts`, `/artifacts/{artifact_id}`, `/projects/{project_id}/items`, `/items/{item_id}`, `/artifact-kinds`, `/content-schemas/{kind}/{schema_version}` |
| `run` | `/threads/{thread_id}/runs`, `/runs/{run_id}`, `/runs/{run_id}/steps`, `/runs/{run_id}/stream`, `/runs/{run_id}/directives`, `/runs/{run_id}/cancel`, `/runs/{run_id}/retry` |
| `review` | `/runs/{run_id}/interrupts`, `/runs/{run_id}/resume` |
| `thread` | `/projects/{project_id}/threads`, `/threads/{thread_id}`, `/threads/{thread_id}/messages` |
| `project` | `/projects`, `/projects/{project_id}` |
| `auth` | `/auth/login`, `/auth/register`, `/auth/logout` |
| `user` | `/me`, `/me/settings` |
| `usage` | `/me/usage` |
| `trace-link` | `/projects/{project_id}/trace-links`, `/trace-links/{link_id}`, `/items/{item_id}/trace`, `/projects/{project_id}/traceability/matrix`, `/projects/{project_id}/traceability/coverage` |
| `llm-model` | `/models`, `/me/model-settings` |

`auth` and `user` are two modules, as the identity and access of a user usually are: signing in, signing up and signing out need nothing of the user, and the user menu uses Sign out, so `user` sits above `auth`.

The usage sits in two places. The usage of a run, `Run.usage` and `RunStep.usage`, belongs to `run`; its limit is `max_cost_usd` of the run config, which the user sets in the run settings. The usage of the user in a month is the module `usage`; its limit is `monthly_budget_usd` of the user, which an admin sets, and `/me/usage` returns it with the usage as `budget_usd`, so `usage` needs nothing of `user`. The rule that compares a cost with its limit serves both and goes to shared code ([section 8](#8-shared-code)).

The entity of the models is named `llm-model`, not `model`, because "model" alone also names the data of any object.

## 7. Objects without an entity

| Object | Where it goes |
|---|---|
| Session, AuthIdentity | The entities of `auth`, through the calls that start and end a session; the web app keeps no session object |
| RunConfig, RunDefaults | Value objects of the runs, in `run/entities`: Run holds a RunConfig, and Project and UserSettings hold RunDefaults, which `project` reads through `@x/project` |
| ArtifactRevision, ItemRevision, the artifact and item kinds of [Data Shape: section 7](../DATA_SHAPE.md#7-requirements-engineering-artifacts) | Part of `artifact` |
| Export | One action: a feature that requests a document and downloads it |
| ProviderCredential, ProjectMember, SourceDocument, DocumentChunk, ItemEmbedding, Comment, Notification | Later phase of the data shape; placed when the phase starts |

## 8. Shared code

Shared code knows no object of the product. What several modules read without being an object goes there:

| Code | Where | Why |
|---|---|---|
| The two views of the app, the `Wording` of a value, and `ViewContext` with `useView` | `shared/lib/view/` | Every layer reads them; `Providers` of `src/providers/`, in the app layer, gives the app its view |
| The addresses of the pages (`routes`) | `shared/config/routes/` | Every module links to the pages of other modules; the folders of `src/app/` are the routes themselves, and the route types of Next.js check each address |
| The tones of a status and their classes | `shared/lib/tone/` | The UI components and the marks of every module color a state with them |
| The languages of the documents | `shared/config/output-language/` | The app offers them, today in the dialog that creates a project; project, the run config and the user settings all carry one, and in `project` it would make `run` read `project` |
| `AuthScreen`, the frame of the sign-in and sign-up screens | `shared/components/frame/layouts/`, with the other layouts of whole screens | It holds no object and no action |

`shared/config/` holds what the app sets once: the addresses of its pages, and the values it offers to choose from, such as the languages of the documents. A value that the user can change is data, not config: the values offered stay in `config/`, and the choice of the user belongs to the entities of its module when it is saved on the server, such as `default_output_language` and `theme` of UserSettings, or to a store of the code that changes it when it stays in the browser, such as the sizes of the panels of the frame.

## 9. Blocks that read several modules

A block that reads several modules sits in the highest module that it reads, or in a module of its own above them when it is a subject of the product, as Activity is:

| Block | Slice | What it reads |
|---|---|---|
| The status of a project on the top bar | `project/widgets/status` | `project`, `thread`, `run`, and Stop of `run/features/stop` |
| The tree of the stages in the side panel of Activity | `activity/widgets/steps` | `workflow` for the stages, in order, with their labels; `run` for the steps and the events of the run; `review` for the pending review |
| The chat of Activity | `activity/widgets/chat` | `thread`, and Send of `thread/features/send-message`; `run`, `review`, `artifact` |
| The workflow graph of a run | `run/widgets/graph` | `workflow` |
| The panel of a pending review | `review/widgets/panel` | `artifact`, and the edit form of `artifact/features/edit` |

## 10. Review checklist

- [ ] Every module has its place in `MODULE_IMPORTS`, and imports only the modules under it
- [ ] No entity holds the hook, the form or the dialog of an action
- [ ] Every widget joins objects with actions, or several actions, and holds no rule of its own
- [ ] Every import between two entities goes through an `@x` file
- [ ] Every query key of an object is in its entity
- [ ] Every object of the data shape is in section 6 or in section 7
