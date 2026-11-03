# Frontend S1d: export a document

The plan of S1d of the [Frontend implementation plan](frontend-implementation-plan.md), the last part of the screen Documents, after [S1a](frontend-s1a-documents-plan.md), [S1b](frontend-s1b-edit-artifacts-plan.md) and [S1c](frontend-s1c-item-peek-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `8126441` (#58). An agent implements from it: every decision is made, and the agent applies it. When the code differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

Short paths as in S1b: `documents/...`, `artifact/...`, `workflow/...` under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`.

## Contents

1. [Row in the PR table](#1-row-in-the-pr-table)
2. [What was read](#2-what-was-read)
3. [Decisions](#3-decisions)
4. [Scope](#4-scope)
5. [Naming](#5-naming)
6. [Shared code first](#6-shared-code-first)
7. [Changes to existing modules](#7-changes-to-existing-modules)
8. [The slices, file by file](#8-the-slices-file-by-file)
9. [State and data flow](#9-state-and-data-flow)
10. [Behavior of each component](#10-behavior-of-each-component)
11. [Screen states and words](#11-screen-states-and-words)
12. [Mocks and screenshots](#12-mocks-and-screenshots)
13. [Tests](#13-tests)
14. [Docs to update](#14-docs-to-update)
15. [Left for the next PRs](#15-left-for-the-next-prs)
16. [Commits and checks](#16-commits-and-checks)
17. [Checklist](#17-checklist)

## 1. Row in the PR table

One PR: it adds one feature, one small widget that mounts it, and one rule to an entity; no change of old code is planned. A fix met on the way goes to the next maintenance PR, not here.

| | |
|---|---|
| Branch | `feat/fe/export`, from `origin/main` once S1c.2 is merged |
| Title | `feat(frontend): export a document from its page and from the command palette, and download it when it is ready` |
| Needs | E1b (#39: `createExport` with its idempotency key, `useExport` that reads a pending export again every 600 ms, the mock of the exports with its file); I1 (the keys, `newIdempotencyKey`); S1b.1 (the `actions` slot of `ArtifactDocument`) |
| After it | S2 to S6. S5 may list the exports of a project in Settings |
| Docs-first | The answers C1 to C4 below. The file endpoint is not in the API (D5 of the implementation plan): the web app downloads `download_url`, and the mock serves that address |

Answers needed before the code. Each has the proposal built here; the answer goes to `docs/ui/usability.md` on `frontend-plan`, 7.5 and 8.2.

| # | Question | Proposal built here |
|---|---|---|
| C1 | What a click on Export opens | One dialog: the documents to export as a list of choices (the templates), the formats of the chosen one, and Export (decision 3) |
| C2 | The words of the button | "Export", beside the title of the document, which gives the noun; its label for assistive technology is "Export Requirement specification" (decision 4) |
| C3 | What follows Export | The dialog closes; a toast says that the file is being prepared, then the file downloads and the toast offers to download it again (decision 6) |
| C4 | Whether an export survives a reload | No: a reload forgets the exports being prepared; they stay on the server, and the list of the exports comes with Settings (decision 7) |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| Implementation plan D5, D7, row E1b | The key made once per action of the user and kept in the variables of the mutation; one retry after a network error or a 5xx with the same key; `409 idempotency_conflict` shown with the generic message; the file "with S1" |
| `docs/API.md` Exports, Idempotency | `POST /projects/{id}/exports` with `template` and `format`, `202`; `422` for a template or a format that the definition lacks; `GET /exports/{id}` with `download_url` when `ready`, valid for a limited time; statuses `pending`, `ready`, `failed` |
| `mocks/workflow/requirements_engineering.v1.json`, `export_templates` | Five templates: `requirement_specification` (markdown, pdf, docx), `product_backlog` "User stories" (markdown, csv, json), `traceability_matrix` "Requirement-to-source table" (csv, markdown), `interview_transcripts` (markdown, pdf), `full_project` "All documents" (json, markdown). Every artifact kind is in `full_project`, so every document of the mock has at least one template |
| `docs/ui/usability.md` (`frontend-plan`) 4, 6.4, 7.5, 8.2 | `[ Export v ]` at the right of the title of a document; export among the commands of the palette; "Buttons are a verb and a noun" |
| `artifact/entities/exports/` on `main` | `createExport(projectId, body, idempotencyKey)`, `getExport`, `useExport(exportId, { isEnabled })` with `refetchInterval` while `pending`, `exportKeys`, `exportStatusLabels`, `CreateExportBody`, `Export` |
| `workflow/entities/definition/export-templates.types.ts` | `ExportTemplate` (`key`, `title`, `artifact_kinds`, `formats`), `exportFormats`, `ExportFormat` |
| `mocks/exports/` | `POST` keeps a pending export (`idempotent`); `GET /exports/{id}` answers it `ready` with `download_url` at `/exports/{id}/file` 1500 ms after its creation (`exportReadyAfterMs`); the file is served as an attachment; scenario `mock-exports` (`empty`, `error`, `loading`) on all three endpoints; no `failed` state |
| `@/shared/lib/pending-action`, `project/features/rename`, `run/features/stop` | A dialog opened from several places: a store from `createPendingActionStore`, `useOpen...Dialog` and `use...Dialog` in one file, the dialog mounted once by a widget |
| `@/shared/api/idempotency` (`newIdempotencyKey`), `@/shared/api/query-client` (`canRetryOnce`) | The key of an action; the rule of one retry |
| `origin/feat/fe/mock` `ExportButton.tsx`, `useExport.ts` | A reference for the menu and the polling; nothing is copied |
| S1a as built (S1b plan, section 2.1) | A reading rule goes to the entity of its object; a lone component or hook stays at the root of its slice; nothing outside the scope in the PR |

## 3. Decisions

The behavior on the screen of each component is in section 10; a decision that sets a behavior points to its row there.

1. **What goes where.**

   | Piece | Where | Why |
   |---|---|---|
   | The templates that hold a kind (`exportTemplatesOf`), the words of each format (`exportFormatLabels`) | `workflow/entities/definition/` | A reading rule and the words of an object of the definition |
   | Ask for an export, follow it, download it; the dialog, the button, the commands | `artifact/features/export` | One action of the user; the export is the resource `exports` of `artifact` (Web App Modules, section 7) |
   | Mount the dialog and the downloads once, and register the commands | `artifact/widgets/export` | A dialog that several places open is mounted once by a widget that the layout mounts (CONTRIBUTING: dialogs opened from several places); it reads only `artifact` and `workflow`, so it sits in `artifact` |
   | The Export button on the page of a document | `documents/widgets/document` places `ExportButton` in the `actions` slot of `ArtifactDocument` | The widget of the page composes the actions |
   | The download of a file by its address | Inside `useExportDownload` of the feature | One user; it touches the page (an anchor clicked), so it is not a `utils` file |

2. **Which templates a document offers.** `exportTemplatesOf(templates, kind)` gives the templates whose `artifact_kinds` include the kind, the ones with the fewest kinds first, then in the order of the definition: the specification offers "Requirement specification", then "Requirement-to-source table", then "All documents". A kind that no template holds gives none, and the page shows no Export button.

3. **One dialog** (answer C1). `ExportDialog`: the title "Export"; a `RadioGroup` "Document" with every template of the definition, each with its title; a `RadioGroup` "Format" with the formats of the chosen template, each with its label (`exportFormatLabels`); a `FieldError` under the form; Cancel and Export (`PendingButton` "Exporting"). One dialog, not a menu with sub menus, so that both choices read at once and the palette opens the same thing.
   - The template chosen at the start is the one the dialog was opened with; the format is the first of that template. Choosing another template chooses its first format.
   - The form is `react-hook-form` with `exportFormSchema` (`export.schema.ts`): `{ template: z.string().min(1), format: z.enum(exportFormats) }`, named after the fields of the request.
   - While the request is pending the dialog does not close: Cancel is disabled, and `onOpenChange(false)` from Escape or a click outside is ignored, as `NewProjectDialog` does. The request is one `POST`, so the wait is short, and an export never starts behind a dialog that the user closed.

4. **The Export button** (answer C2). `ExportButton({ projectId, artifact })`: an outline button "Export" (icon `DownloadIcon`) with `aria-label` "Export " followed by the title of the artifact. It opens the dialog with the first template of `exportTemplatesOf(templates, artifact.kind)`, and renders nothing while the definition loads or when the kind has no template. It stays enabled while a run works: an export reads the stored versions, and the API does not refuse it then. The document page places it in the `actions` slot after Edit.

5. **The palette.** `useExportCommands(projectId)` registers one command per template of the definition while it is mounted: id `artifact.export.<template key>`, label "Export: Requirement specification", group "Export", icon `DownloadIcon`; it opens the dialog with that template. The dialog opens from two places, so it is mounted once and opened through `useOpenExportDialog()(templateKey)`, on a store from `createPendingActionStore()` that keeps the template key.

6. **After Export** (answer C3).
   - The key is `newIdempotencyKey()`, made in the submit handler, once per press of Export, and passed in the variables of the mutation (`{ body, idempotencyKey }`), so the retry of the mutation sends it again (D7). `useCreateExport(projectId)` sets `retry: canRetryOnce`: one retry after a network error or a 5xx, none after a 4xx.
   - On `202`: the dialog closes; `followExport(export.id)` adds the id to `useFollowedExportsStore`; a toast `toast.loading` with the id `export:<id>` says "Preparing Requirement specification (PDF)" (`exportFileLabel(template, format)`).
   - `ExportDownloads`, mounted with the dialog, renders one `ExportDownload` per followed id; each calls `useExportDownload(id)`, which reads `useExport(id)` (it reads again every 600 ms while `pending`) and, once:
     - on `ready`: starts the download (an `a` with `href = download_url` and `download = file_name`, appended, clicked and removed), replaces the toast with `toast.success` "Requirement specification (PDF) is ready" with the action "Download again" (the same address) and `duration: actionToastDuration`, and forgets the id;
     - on `failed`: replaces the toast with `toast.error` "The export failed." with the action "Try again" (`duration: actionToastDuration`), which opens the dialog again with the template of the export (`useOpenExportDialog`), so that the user presses Export again and a new key goes with the new action; then forgets the id;
     - when the read fails (after the one retry of the queries): replaces the toast with `toast.error` "The export could not be checked." and forgets the id.
   - A `useRef` flag in `useExportDownload` makes each outcome run once, also when the component renders again before the id is forgotten.
   - `422` (a template or a format the definition no longer has): the problems at their fields (`showFieldProblems`), the rest under the form (`formErrorOf`); the dialog stays open. `409 idempotency_conflict` and any other error: the generic message of `errorMessageOf(error, {})` under the form.

7. **The followed exports live in memory** (answer C4): `useFollowedExportsStore` is a zustand store without `persist`. A reload forgets them; the export stays on the server.

8. **Mounting.** `artifact/widgets/export` holds `ExportCommands` (calls `useExportCommands`, renders nothing) and `ExportDialogs` (renders `ExportDialog` and `ExportDownloads`). The project layout mounts both in `projectContributions`, after `ProjectDialogs`.

9. **Words** in `exportMessages` (`artifact/features/export/export.constants.ts`); `exportFormatLabels` in `workflow/entities/definition/export-templates.constants.ts`.

10. **`'use client'`.** The project layout imports `artifact/widgets/export`: `useExportCommands`, `useOpenExportDialog`, `useCreateExport`, `useExportDownload`, `useFollowExport` and the components with state start with `'use client'`.

## 4. Scope

| | |
|---|---|
| Endpoints called | `POST /projects/{id}/exports` with `Idempotency-Key` |
| Endpoints read | `GET /exports/{id}` (every 600 ms while pending), `GET /workflow/definition`; the file at `download_url` (a download of the browser, not a request of the app) |
| Written new | Section 8 |
| Not built | The list of the exports of a project (`GET /projects/{id}/exports`; `useProjectExports` exists); an export that survives a reload |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Feature slice | The action | `artifact/features/export` |
| Widget slice | The block | `artifact/widgets/export` |
| Components of the action | `<Verb><Object><Role>` | `ExportButton`, `ExportDialog` |
| Components that render nothing in place | `...Commands`, `...Dialogs`, what they follow | `ExportCommands`, `ExportDialogs`, `ExportDownloads` (with `ExportDownload` in the same file) |
| Mutation hook | `use<Verb><Object>` | `useCreateExport` |
| Dialog hooks | `useOpen<...>Dialog`, `use<...>Dialog` in one file | `useOpenExportDialog`, `useExportDialog` in `useOpenExportDialog.ts` |
| Other hooks | `use<What>` | `useExportCommands`, `useExportDownload`; `useFollowExport` and `useFollowedExports` (the two hooks of the store, in `useFollowExport.ts`) |
| Stores | `<topic>.store.ts` | `export-dialog.store.ts` (`useExportDialogStore`), `followed-exports.store.ts` (`useFollowedExportsStore`) |
| Schema | `<form>FormSchema` | `exportFormSchema` in `export.schema.ts` |
| Pure rules | What they give | `exportTemplatesOf` (workflow), `exportFileLabel` (feature) |
| Command ids | `<module>.<action>` | `artifact.export.<template key>` |
| Words | `<topic>Messages`, `<value>Labels` | `exportMessages`, `exportFormatLabels` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` | `@/shared/lib/pending-action` | The dialog opened from two places |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogClose`, `RadioGroup`, `RadioGroupItem`, `Button`, `PendingButton`, `FieldError`, `FieldGroup` | `shared/components/ui` | The dialog |
| `Form`, `FormFieldSet`, `showFieldProblems`, `formErrorOf` | `@/shared/components/form` | The form and its errors |
| `useCommands` | `@/shared/components/frame` | The commands |
| `toast` | `sonner` | Preparing, ready, failed |
| `actionToastDuration` | `@/shared/lib/timing` | The toasts with an action |
| `newIdempotencyKey` | `@/shared/api/idempotency` | The key of an action |
| `canRetryOnce` | `@/shared/api/query-client` (defined in `query-retry.utils.ts`; the index exports it from this PR on, see below) | The retry of the mutation |
| `errorMessageOf` | `@/shared/api/error` | The other errors |
| `createExport`, `useExport`, `type Export`, `type CreateExportBody`, `type Artifact` | `artifact/entities` | The request and the polling |
| `useWorkflowDefinition`, `type ExportTemplate`, `exportFormats`, `type ExportFormat` | `workflow/entities` | The templates |
| `itToastsOnResult`, `itAsksForFieldsBeforeSending`, `expectNoAccessibilityViolations`, `spyOnToast`, `openCommandPalette`, `renderWorkbench` | `@/test/*` | The tests |

### Extract before new code

| What | To | Why |
|---|---|---|
| `canRetryOnce` | Exported from `shared/api/query-client/index.ts` (it lives in `query-retry.utils.ts`, used today only by the default options of the client) | The mutation of the export sets `retry: canRetryOnce`; a slice imports shared code through its index |

### Checked, not extracted

| Candidate | Why it stays |
|---|---|
| A download helper in `shared/lib/url` | One user; it moves there with a second |
| A store of followed jobs in shared code | One user; S2 follows runs through their stream, not by polling |
| `exportTemplatesOf` in the feature | A rule of the templates of the definition: it goes to `workflow`, where S4 (the export of the traceability table) and S5 can read it |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` (`frontend-plan`) | C1 to C4 | none |
| `workflow/entities/definition/export-templates.utils.ts` (new: `exportTemplatesOf`), `export-templates.constants.ts` (new: `exportFormatLabels`), tests, `index.ts` | Decisions 2, 9 | 1 |
| `mocks/exports/exports.handlers.ts`, its test; `mocks/README.md` | The scenario `mock-export` (section 12) | 2 |
| `shared/api/query-client/index.ts` | Exports `canRetryOnce` | 3 |
| `artifact/features/export/` (new) | Decisions 3 to 7 | 3 |
| `artifact/widgets/export/` (new) | Decision 8 | 4 |
| `app/(project)/projects/[projectId]/layout.tsx` | `<ExportCommands projectId={projectId} />`, `<ExportDialogs projectId={projectId} />` in `projectContributions` | 4 |
| `documents/widgets/document/components/DocumentPage.tsx`, test | `ExportButton` in the `actions` slot (decision 4) | 4 |
| `tests/screenshots/projects/documents.spec.ts` | Section 12 | 4 |
| Web App Modules, Web App, frontend README, implementation plan | Section 14 | 5 |

Files that two commits change: `mocks/README.md` (2 the scenario, 5 the addresses of the screen), `workflow/entities/index.ts` (1 only).

## 8. The slices, file by file

### `workflow/entities/definition`

```ts
// export-templates.utils.ts
/** The templates that hold the kind of a document, the most specific first (the fewest kinds), then in the order of the definition. */
export function exportTemplatesOf(templates: readonly ExportTemplate[], kind: string): ExportTemplate[]

// export-templates.constants.ts
/** The words of each file format of an export, the same in both views. */
export const exportFormatLabels = {
  markdown: 'Markdown',
  pdf: 'PDF',
  docx: 'Word',
  csv: 'CSV',
  json: 'JSON',
} as const satisfies Record<ExportFormat, string>
```

### `artifact/features/export`

```text
artifact/features/export/
├── components/
│   ├── ExportButton.tsx
│   ├── ExportDialog.tsx          the dialog and its form (ExportForm stays local in the file)
│   ├── ExportDownloads.tsx       one ExportDownload per followed id (ExportDownload local in the file)
│   └── __tests__/ExportButton.test.tsx, ExportDialog.test.tsx, ExportDownloads.test.tsx
├── hooks/
│   ├── useCreateExport.ts
│   ├── useOpenExportDialog.ts    useOpenExportDialog, useExportDialog
│   ├── useExportCommands.ts
│   ├── useExportDownload.ts
│   ├── useFollowExport.ts        useFollowExport (adds an id), useFollowedExports (reads the ids)
│   └── __tests__/useCreateExport.test.ts, useExportCommands.test.ts, useExportDownload.test.ts
├── stores/
│   ├── export-dialog.store.ts    useExportDialogStore = createPendingActionStore()
│   └── followed-exports.store.ts useFollowedExportsStore: exportIds, follow, forget
├── export.constants.ts           exportMessages
├── export.schema.ts              exportFormSchema, ExportFormValues
├── export.utils.ts               exportFileLabel
├── __tests__/export.utils.test.ts, export.utils.data.ts, export.schema.test.ts
└── index.ts                      ExportButton, ExportDialog, ExportDownloads, useExportCommands, exportMessages
```

```ts
/** The name of the file in the words of the user: the title of its template and the label of its format, such as "Requirement specification (PDF)". */
export function exportFileLabel(template: Pick<ExportTemplate, 'title'> | undefined, format: ExportFormat): string

/**
 * Asks for an export with the key of the action, which a retry sends again; one retry after a
 * network error or a 5xx. On success it follows the export and opens the toast that says it is
 * being prepared. A refusal shows its problems at the fields through `setError`.
 */
export function useCreateExport(
  projectId: string,
  { setError, onAsked }: { setError: UseFormSetError<ExportFormValues>; onAsked: () => void },
): UseMutationResult<Export, Error, { body: CreateExportBody; idempotencyKey: string }> & { formError: string | null }

/**
 * Follows one export until it is ready or failed: downloads it once and says so in its toast, or
 * says why it did not; then forgets it. `retry` asks again for the same document with a new key.
 */
export function useExportDownload(exportId: string): void

/** Registers one command per export template while mounted; each opens the dialog with its template. */
export function useExportCommands(projectId: string): void
```

```tsx
/** Exports the document of an artifact; nothing while the templates load or when none holds its kind. */
export function ExportButton({ projectId, artifact }: { projectId: string; artifact: Pick<Artifact, 'kind' | 'title'> })

/** Asks which document and which format to export; one on the screen, opened by the Export button and the palette. */
export function ExportDialog({ projectId }: { projectId: string })

/** Follows every export asked for in this page, each until its file is ready or failed. Renders nothing visible. */
export function ExportDownloads()
```

`useFollowExport.ts` holds the two hooks of the store `followed-exports.store.ts` (CONTRIBUTING: the hooks of one store share a file, named after the hook that the parts call). `useExportDownload` calls `useOpenExportDialog` for the "Try again" of a failed export; it never calls `useCreateExport`.

### `artifact/widgets/export`

```text
artifact/widgets/export/
├── components/
│   ├── ExportCommands.tsx        calls useExportCommands; renders nothing
│   ├── ExportDialogs.tsx         ExportDialog and ExportDownloads
│   └── __tests__/ExportDialogs.test.tsx
└── index.ts
```

## 9. State and data flow

| State | Where |
|---|---|
| The dialog open and its template | `useExportDialogStore` (`targetId` is the template key) |
| The chosen template and format | `react-hook-form` of `ExportDialog` |
| The exports followed | `useFollowedExportsStore`, in memory |
| An export | `useExport(id)`, read again while pending |
| Whether an outcome of an export ran | A `useRef` in `useExportDownload` |

Flow: Export (button or palette) opens the dialog with a template; Export sends `POST` with a new key; the dialog closes and the toast says "Preparing"; the export is read every 600 ms; on `ready` the file downloads and the toast offers it again; on `failed` the toast offers Try again, which opens the dialog with the same template.

## 10. Behavior of each component

| Component (where) | What it shows; disabled or hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `ExportButton` (the `actions` slot of a document page, after Edit) | An outline button "Export" with `DownloadIcon`; `aria-label` "Export Requirement specification". Enabled while the agents work (an export reads stored versions). Not rendered while the definition loads, or when no template holds the kind | Clicks it, or Enter or Space on it | `ExportDialog` opens with the first template of the kind (`exportTemplatesOf`), through its store | The dialog takes the focus; when it closes, the focus returns to this button |
| The commands of the palette (`useExportCommands`) | One command per template of the definition, "Export: Requirement specification", group "Export", `DownloadIcon` | Opens the palette (`Ctrl+K`), types "Export", picks one with Enter or a click | The palette closes and `ExportDialog` opens with that template | The dialog takes the focus; when it closes, the focus returns where it was before the palette opened |
| `ExportDialog` (mounted once by `ExportDialogs`) | The title "Export"; the `RadioGroup` "Document" with every template, the one it was opened with chosen; the `RadioGroup` "Format" with the formats of the chosen template, the first chosen; the error of the form; Cancel and Export (`PendingButton` "Exporting") | Moves within a group with the arrow keys or a click; picks another template; presses Export, or Enter; presses Cancel, Escape, or clicks outside | Another template chooses its first format. Export sends the request with a new key of the action (decision 6). On `202` the dialog closes and the toast "Preparing ..." shows. `422`: the problems at their fields, the rest under the form, the dialog stays. Any other error: the message under the form, the dialog stays; a second Export sends a new key. Cancel, Escape and a click outside close it | The focus goes to the chosen radio of "Document" on open (Radix); Tab goes to "Format", then Cancel, then Export. While the request is pending, Cancel is disabled and Escape and a click outside do nothing, as `NewProjectDialog` does, so a request never runs behind a closed dialog without its toast |
| The toast of an export (`ExportDownloads`, one per export followed) | "Preparing Requirement specification (PDF)" with its spinner (`toast.loading`, id `export:<id>`) while the export is `pending`; then one of: "Requirement specification (PDF) is ready" with "Download again"; "The export failed." with "Try again"; "The export could not be checked." | Waits; clicks Download again; clicks Try again; dismisses a toast | Ready: the browser downloads the file once by itself, and Download again downloads it again from the same address. Failed: Try again opens `ExportDialog` with the template of the export, and Export there sends a new key. Dismissing "Preparing" does not stop the export: the next state replaces the toast by its id and shows again. A reload forgets the exports followed, and their toasts go; the exports stay on the server | Toasts never take the focus; the hotkey of the toaster (Sonner, `Alt+T`) moves the focus to them, so that Download again and Try again are reached by keyboard. The toasts with an action stay `actionToastDuration` |
| Several exports at once | One toast per export, stacked by Sonner, each replaced by its own outcome | Asks for another export while one is pending | Each is followed on its own; nothing waits for the other | As above |
| `ExportCommands`, `ExportDialogs` (the project layout) | Nothing visible | - | They register the commands and mount the dialog and the toasts once | - |

The browser may ask once for the right to download several files when a second export of the page downloads by itself; Download again works either way, since it is a press of the user.

## 11. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| The button | "Export" at the right of the title | the specification page |
| No template for the kind | No button | unit tests (every kind of the mock has `full_project`) |
| The dialog | Templates, formats of the chosen one | press Export |
| Request pending | `PendingButton` "Exporting" | `?mock-exports=loading` |
| Request failed | The message under the form | `?mock-exports=error` |
| Preparing, then ready | The loading toast, then the file and "Download again" | default |
| Export failed | The error toast with Try again | `?mock-export=failed` |
| Export not checked | The error toast | `?mock-export=error` |
| The palette | "Export: Requirement specification" and the four others | `Ctrl+K`, type "Export" |

```ts
export const exportMessages = {
  button: 'Export',
  buttonLabel: (title: string) => `Export ${title}`,
  dialogTitle: 'Export',
  template: 'Document',
  format: 'Format',
  cancel: 'Cancel',
  submit: 'Export',
  submitting: 'Exporting',
  commandGroup: 'Export',
  command: (title: string) => `Export: ${title}`,
  preparing: (file: string) => `Preparing ${file}`,
  ready: (file: string) => `${file} is ready`,
  downloadAgain: 'Download again',
  failed: 'The export failed.',
  tryAgain: 'Try again',
  unchecked: 'The export could not be checked.',
} as const
```

## 12. Mocks and screenshots

- A new scenario `mock-export` on `GET /exports/{export_id}` only, read with `answerScenario('export')`: `error` and `loading` as every scenario, and `failed`, which answers the export with `status: 'failed'` and no `download_url`. `mock-exports` keeps its meaning on the three endpoints. The handler test gets a case for `failed`. The mocks README lists the scenario.
- The mock keeps an export `pending` for 1500 ms (`exportReadyAfterMs`), so the toast "Preparing" shows in `pnpm dev:mock`; nothing changes there.
- Screenshot: the dialog open on the specification.

## 13. Tests

| File | Cases |
|---|---|
| `workflow/.../export-templates.utils.test.ts` + data | `exportTemplatesOf`: the specification (three, in order), a kind in `full_project` only, a kind in none |
| `artifact/features/export/__tests__/export.utils.test.ts` + data | `exportFileLabel` for each format; a template not found reads its key |
| `.../export.schema.test.ts` | A missing template; a format outside `exportFormats` |
| `.../useCreateExport.test.ts` | The request carries the key; a retry after a network error sends the same key; no retry after a 4xx; `422` at the fields; the loading toast with the id `export:<id>` (`spyOnToast`) |
| `.../useExportCommands.test.ts` | One command per template, with its id and label; it opens the dialog with that template |
| `.../useExportDownload.test.ts` | Pending then ready: one click on an anchor with the address and the file name (spy on `HTMLAnchorElement.prototype.click`), the toast replaced, the id forgotten; failed: the error toast, Try again opens the dialog with the template of the export; a failed read: the "not checked" toast; each outcome once |
| `.../ExportDialog.test.tsx` | Opens with the template it was given; the formats follow the template; Export closes and toasts; two presses of Export after a failure send two keys; stays open on an error with the message; while pending, Cancel is disabled and Escape keeps the dialog open; the focus on the chosen template on open, back on the opener on close; axe. No `itAsksForFieldsBeforeSending`: both fields always hold a value |
| `.../ExportButton.test.tsx` | Opens the dialog with the first template of the kind; its label for assistive technology; nothing without a template; nothing while the definition loads |
| `artifact/widgets/export/.../ExportDialogs.test.tsx` | Rendered with `renderWorkbench`: the palette lists the commands, a command opens the dialog, an export runs to its download |
| `documents/widgets/document/.../DocumentPage.test.tsx` (extended) | The Export button in the `actions` slot after Edit |
| `mocks/exports/__tests__/exports.handlers.test.ts` (extended) | `mock-export=failed` |

Helpers: none new. The tests of the hooks use `renderHookWithProviders`; the tests of the dialog render it beside a button that opens it through `useOpenExportDialog`, a local `function Opener` of the test file.

## 14. Docs to update

- `docs/architecture/web-app-modules.md`: row `artifact` features `export` and widgets `export`; section 6 State of `artifact`.
- `docs/architecture/web-app.md` section 9: the files of the export.
- `frontend/src/mocks/README.md`: the scenario `mock-export` and the addresses of section 11.
- Implementation plan: row S1d; D5 (the file through `download_url`); the open point "Exports" closed; the checklist ("S1 merged" once S1a to S1d are).

## 15. Left for the next PRs

| Item | Where |
|---|---|
| The list of the exports of a project, an export that survives a reload | S5 (Settings) or a later PR |
| The export "Requirement-to-source table" from Trace | S4, with `useOpenExportDialog` |
| The file endpoint in the API | `docs/fe/api-fields` (D5), when the backend serves files |

## 16. Commits and checks

1. `feat(workflow): give the export templates of a kind and the words of each format`
2. `feat(mocks): answer an export that failed`
3. `feat(artifact): ask for the export of a document and download it when it is ready`
4. `feat(frontend): export from the page of a document and from the command palette`
5. `docs: describe the export of a document`

Each file goes in the commit of its row in section 7. The plan and the prompt stay on `frontend-plan`.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `modules/workflow/entities/definition`, `modules/artifact`, `modules/documents/widgets/document`, `mocks/exports`; typecheck once. No full suite, E2E, screenshots or build locally. The ASCII and comment greps of S1b.

## 17. Checklist

- [x] C1 to C4 written in `usability.md` on `frontend-plan` (7.5, 8.2; 2026-11-03), as this plan builds them; the user reads them there before the code
- [ ] S1c.2 merged; branch from `origin/main`
- [ ] Commits 1 to 5, each checked
- [ ] The download checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after)
- [ ] The description of the PR written from this plan; the endpoint checked against `createExport`
