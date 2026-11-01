# Frontend S1d: export a document

The plan of the PR S1d of the [Frontend implementation plan](frontend-implementation-plan.md), the last of the four PRs of the screen Documents, after [S1a](frontend-s1a-documents-plan.md), [S1b](frontend-s1b-edit-artifacts-plan.md) and [S1c](frontend-s1c-item-peek-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md); an agent implements from it, every decision is made.

Short paths as in S1a.

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
10. [Screen states and words](#10-screen-states-and-words)
11. [Mocks and screenshots](#11-mocks-and-screenshots)
12. [Tests](#12-tests)
13. [Docs to update](#13-docs-to-update)
14. [Left for the next PRs](#14-left-for-the-next-prs)
15. [Commits and checks](#15-commits-and-checks)
16. [Checklist](#16-checklist)

## 1. Row in the PR table

| | |
|---|---|
| Branch | `feat/fe/export`, from `origin/main` once S1c is merged |
| Title | `feat(frontend): export a document from its page and from the command palette` |
| Needs | E1b (#39: `createExport` with its idempotency key, `useExport` that reads a pending export again, the mock of the exports with its file); I1 (#29, the keys); S1a (the document page) |
| After it | S2 to S6. S5 may list the exports of a project in Settings |
| Docs-first | `usability.md` draws `[ Export v ]` on the document (6.3, 6.4, 7.5) and lists export among the commands of the palette (4), with "Export specification" as a button (8.2), but not what follows a click; decisions 2 to 5 describe it and go to the local copy of `usability.md`. The file endpoint is not in the API (D5 of the implementation plan): the web app downloads `download_url`, and the mock serves that address |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| Implementation plan D5, D7, row E1b, open point "Exports" | The key made once per action of the user, the retry once after a network error or a 5xx with the same key, `409 idempotency_conflict` shown with the generic message; the file "with S1" |
| `docs/API.md` Exports | `POST /projects/{id}/exports` with `template`, `format`, `202`, `422` for a template or format the definition lacks; `GET /exports/{id}` with `download_url` when `ready`, valid for a limited time |
| `requirements_engineering.v1.json`, `export_templates` | Five templates, each with its artifact kinds and formats: Requirement specification (md, pdf, docx), User stories (md, csv, json), Requirement-to-source table (csv, md), Interview transcripts (md, pdf), All documents (json, md) |
| `main` | `createExport(projectId, body, idempotencyKey)`, `useExport` (polls every 600 ms while pending), `exportStatusLabels`, `ExportTemplate`, `exportFormats`, `useWorkflowDefinition`; `createPendingActionStore`; `useCommands`; the mock: `POST` stores a pending export, `GET` answers it ready with `download_url` pointing at `/exports/{id}/file`, which the mock serves as an attachment, scenarios `mock-exports` |
| `origin/feat/fe/mock` `ExportButton.tsx`, `useExport.ts` | A reference for the menu and the polling; not copied |

## 3. Decisions

1. **One feature, `artifact/features/export`.** Asking for an export changes nothing of an artifact, but it is an action of the user on the documents of a project; Export is the resource `exports` of `artifact` (Web App Modules section 7), so the feature sits in `artifact`.
2. **Which templates a document offers.** `exportTemplatesOf(templates, kind)` gives the templates whose `artifact_kinds` include the kind of the document, the ones with the fewest kinds first, so the specification offers "Requirement specification" before "Requirement-to-source table" and "All documents". A document whose kind no template holds shows no Export button.
3. **The Export button opens a dialog**, `[ Export v ]` of the skeletons: "Export specification" as its label (`Export` and the title of the first template, 8.2). The dialog `ExportDialog`: a radio group of the templates of decision 2 (the first chosen), a radio group of the formats of the chosen template (the first chosen), the labels of the formats in `exportFormatLabels` ("Markdown", "PDF", "Word", "CSV", "JSON"), and Export. One dialog, not a menu with sub menus, so the two choices read at once and the palette opens the same thing.
4. **The palette.** `ExportCommands`, mounted in the contributions of the project layout, registers one command per template of the definition, "Export: Requirement specification", id `artifact.export.<template key>`, group of the actions; it opens the dialog with that template chosen. The dialog opens from two places, so it is mounted once (`ExportDialogs` in the contributions) and opened through `useOpenExportDialog`, on a store from `createPendingActionStore` that keeps the template key (CONTRIBUTING: dialogs opened from several places).
5. **After Export.**
   - The key is `crypto.randomUUID()`, made when the user presses Export, and kept in the variables of the mutation, so a retry sends it again (D7). `useCreateExport` retries once after a network error or a 5xx.
   - On `202`, the dialog closes, a toast with a spinner says "Preparing the requirement specification (PDF)...", and the export joins the exports followed by `useFollowExports`, a small store of ids in the feature (`followed-exports.store.ts`).
   - `ExportFollowers`, mounted with `ExportDialogs`, renders one `ExportFollower` per followed id, which reads `useExport(id)` (polling while pending). On `ready`, it starts the download (an `a` with `href = download_url` and `download = file_name`, clicked once), replaces the toast with "Requirement specification downloaded" and an action "Download again" (the same address, while it is valid), and drops the id. On `failed`, the toast says "The export failed." with `Try again`, which asks again with a new key (a new action of the user). A read that fails keeps polling as `useExport` does; after 5 failures in a row the toast says "The export could not be checked." and the id is dropped.
   - `422` (a template or format the definition no longer has) and the other errors of the request: the dialog stays open with the message of `errorMessageOf`; `409 idempotency_conflict` takes the generic message.
   - The followed ids live in memory: a reload forgets them, and the export stays on the server. Said in section 14.
6. **Where the button sits.** `documents/widgets/document` places `ExportButton` at the right of the title of the document (`artifact/features/export`, takes the projectId and the kind). It is enabled while a run works: an export reads the stored versions and the API does not refuse it then.
7. **Words** in `exportMessages` (`artifact/features/export/export.constants.ts`); `exportFormatLabels` in `workflow/entities/definition/export-templates.constants.ts`, beside the formats.

## 4. Scope

| | |
|---|---|
| Endpoints called | `POST /projects/{id}/exports` with `Idempotency-Key` |
| Endpoints read | `GET /exports/{id}` (polling), the definition; the file at `download_url` (a download, not a request of the app) |
| Written new | Section 8 |
| Not built | The list of the exports of a project (section 14) |

## 5. Naming

| Part | Name |
|---|---|
| Feature slice | `artifact/features/export` |
| Components | `ExportButton`, `ExportDialog`, `ExportDialogs`, `ExportCommands`, `ExportFollowers` (with `ExportFollower` in the same file) |
| Hooks | `useCreateExport`, `useOpenExportDialog` and `useExportDialog` (in `useOpenExportDialog.ts`), `useFollowExports` |
| Stores | `export-dialog.store.ts` (`useExportDialogStore`), `followed-exports.store.ts` (`useFollowedExportsStore`) |
| Pure rules | `exportTemplatesOf`, `exportFileLabel` (the toast name: template title and format label) |
| Command ids | `artifact.export.<template key>` |
| Words | `exportMessages`, `exportFormatLabels` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` | `@/shared/lib/pending-action` | The dialog opened from two places |
| `Dialog`, `RadioGroup`, `PendingButton` | `shared/components/ui` | The dialog |
| `useCommands`, `PaletteGroup` | frame | The commands |
| `toast` (with `id` to replace one toast) | `sonner` | Preparing, downloaded, failed |
| `createExport`, `useExport`, `exportKeys` | `artifact/entities` | The request and the polling |
| `useWorkflowDefinition` | `workflow/entities` | The templates |
| `itToastsOnResult`, `itAsksForFieldsBeforeSending` | `@/test/suites` | The cases of the action |

### Extract before new code

None.

### Checked, not extracted

| Candidate | Why it stays |
|---|---|
| A download helper (`a` click) | One user; it moves to `shared/lib/url` with a second |
| A store of followed jobs | One user |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `usability.md` (local) | Decisions 2 to 5 | none |
| `workflow/entities/definition/export-templates.constants.ts` (new), `index.ts` | `exportFormatLabels` | 1 |
| `artifact/features/export/` (new) | Section 8 | 2 |
| `artifact/entities/hooks/useExportQueries.ts` | `useExport` takes `retry` options for the follower; its JSDoc names the polling | 2 |
| `documents/widgets/document/components/DocumentPage.tsx` | `ExportButton` (decision 6) | 3 |
| `app/(project)/projects/[projectId]/layout.tsx` | `<ExportCommands projectId />`, `<ExportDialogs projectId />` in the contributions of a found project | 3 |
| Web App Modules, Web App, mocks README, implementation plan (D5 and the open point "Exports" closed) | Section 13 | 4 |

## 8. The slices, file by file

```text
artifact/features/export/
├── components/
│   ├── ExportButton.tsx
│   ├── ExportDialog.tsx
│   ├── ExportDialogs.tsx
│   ├── ExportCommands.tsx
│   ├── ExportFollowers.tsx
│   └── __tests__/
├── hooks/
│   ├── useCreateExport.ts
│   ├── useOpenExportDialog.ts
│   ├── useFollowExports.ts
│   └── __tests__/
├── stores/export-dialog.store.ts, followed-exports.store.ts
├── export.constants.ts
├── export.utils.ts             exportTemplatesOf, exportFileLabel
├── __tests__/export.utils.test.ts, .data.ts
└── index.ts
```

```ts
/** The templates that hold the kind of a document, the most specific first (decision 2). */
export function exportTemplatesOf(templates: readonly ExportTemplate[], kind: string): ExportTemplate[]

/** Asks for an export with the key of the action; retries once after a network error or a 5xx. */
export function useCreateExport(projectId: string): UseMutationResult<Export, ApiError, { body: CreateExportBody; idempotencyKey: string }>
```

## 9. State and data flow

| State | Where |
|---|---|
| The dialog open and its template | `useExportDialogStore` |
| The chosen template and format in the dialog | `react-hook-form` of the dialog |
| The exports followed | `useFollowedExportsStore` (in memory) |
| The export | `useExport(id)`, polling |

Flow: Export; the dialog; `POST` with the key; the toast "Preparing"; polling every 600 ms; `ready`: download and the toast "downloaded".

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| No template for the kind | No button | the persona catalog has one (interview transcripts); a kind without, in the unit tests |
| Request pending | `PendingButton` | `?mock-exports=loading` |
| Request failed | Message in the dialog | `?mock-exports=error` |
| Preparing, then downloaded | Toast replaced | default |

```ts
export const exportMessages = {
  button: (title: string) => `Export ${title.toLowerCase()}`,
  dialogTitle: 'Export',
  template: 'Document',
  format: 'Format',
  submit: 'Export',
  preparing: (file: string) => `Preparing the ${file}...`,
  downloaded: (file: string) => `${file} downloaded`,
  downloadAgain: 'Download again',
  failed: 'The export failed.',
  unchecked: 'The export could not be checked.',
  tryAgain: 'Try again',
  command: (title: string) => `Export: ${title}`,
}
export const exportFormatLabels = { markdown: 'Markdown', pdf: 'PDF', docx: 'Word', csv: 'CSV', json: 'JSON' } as const satisfies Record<ExportFormat, string>
```

## 11. Mocks and screenshots

- No handler change; check that the mock keeps the export `pending` for one read before `ready` (so the toast "Preparing" shows), else add that step to `exports.lookup.ts` (`withReadyFile` after the first read).
- Screenshot: the dialog open on the specification.

## 12. Tests

| File | Cases |
|---|---|
| `export.utils.test.ts` | `exportTemplatesOf` (kinds, order, none); `exportFileLabel` |
| `useCreateExport.test.ts` | The header carries the key; a retry after a network error sends the same key; no retry after a 4xx |
| `ExportDialog.test.tsx` | Templates and formats; changing the template changes the formats; `itToastsOnResult`; stays open on an error; axe |
| `ExportCommands.test.tsx` | One command per template; it opens the dialog with that template |
| `ExportFollowers.test.tsx` | Pending then ready: download started once (spy on the anchor click), toast replaced; failed: toast with Try again, which sends a new key; five failed reads drop it |
| `DocumentPage.test.tsx` | The button with the first template; none without a template |

## 13. Docs to update

- Web App Modules: row `artifact` features `export`; Web App section 9: the files.
- Mocks README: the export addresses.
- Implementation plan: row S1d, D5 (the file through `download_url`), open point "Exports" closed, checklist ("S1 merged" when S1a to S1d are).

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The list of the exports of a project, an export that survives a reload | S5 (Settings) or a later PR |
| The export "Requirement-to-source table" from Trace | S4 |

## 15. Commits and checks

1. `feat(frontend): name the export formats`
2. `feat(frontend): ask for the export of a document and download it when it is ready`
3. `feat(frontend): export from the page of a document and from the command palette`
4. `docs(frontend): describe the export of a document`

Checks: ESLint and Prettier on the changed files; Vitest on `modules/workflow`, `modules/artifact`, `modules/documents`; typecheck once.

## 16. Checklist

- [ ] Decisions 2 to 5 written in `usability.md`
- [ ] S1c merged; branch from `origin/main`
- [ ] Commits 1 to 4, each checked
- [ ] The download checked once in `pnpm dev:mock` (one dev server, stopped after)
- [ ] The description of the PR written from this plan; the endpoint checked against `createExport`
