# Prompt: create a frontend entity plan

Write a plan for building the next entity PR of the frontend, following the shape of the E5 plan. The plan is a single markdown file in `docs/`, named `frontend-<id>-<module>-plan.md` (for example `frontend-e6-thread-plan.md`). An agent implements from it, so it must be prescriptive: every decision is made and written down, the agent only applies it.

## Prerequisites

Load these skills before starting (they change how you place and review code). All are committed in this repo under `docs/skills/`:

1. **Feature-Sliced Design** (`docs/skills/feature-sliced-design/SKILL.md`) - for module placement, layer imports, and `@x` cross-import decisions. The methodology reference is [fsd.how](https://fsd.how) (v2.1).
2. **Clean Review** (`docs/skills/clean-review/SKILL.md`) - for the 7-dimension quality check (naming, functions, DRY, YAGNI, magic numbers, readability, conventions). Based on "Clean Code" by Robert C. Martin.
3. **React Best Practices** (`docs/skills/vercel-react-best-practices/SKILL.md`) - for the hook and data-fetching rules the sketches follow: derived state computed, not synced through an effect; correct dependencies; parallel fetching; Suspense boundaries. Read the rules a sketch touches, not the whole set.
4. **React Foundation Review** (`docs/skills/react-foundation-review/SKILL.md`) - for reviewing the sketches before handing the plan over: hook misuse, state synced through an effect, prop drilling, god components.
5. **Fowler Refactor** (`docs/skills/fowler-refactor/SKILL.md`) - the refactoring catalog for the code the plan changes in place: a smell met in a copy or a change (a long function, a repeated branch, a parameter list that grows) maps to its pattern (Extract Function, Extract Hook, Introduce Parameter Object, Replace Conditional with Lookup Table) in `references/fowler-patterns.md`. The skill runs only on an explicit `/fowler-refactor`; writing the plan reads its reference, not the skill.

Read the files before writing the plan. If your tool supports skills (Claude Code, ZCode), you can also install them to `~/.claude/skills/` for auto-loading, but reading the files in this repo is enough. An agent that implements from the plan loads the same files when it needs the rule behind a decision.

## Docs-first rule

If you find a gap in the API docs (`docs/API.md`), the data shape (`docs/DATA_SHAPE.md`), or any architecture doc - something the entity needs but the docs do not describe, or something the docs get wrong - do NOT write code that invents behavior. Instead:

1. Propose the fix or addition on the `docs/fe/api-fields` branch (or tell the user to add it there).
2. The plan notes the gap in its "Left for the next PRs" section.
3. No code and no mock answers an endpoint that the API does not describe.

## Sources to read before writing

Read these in order. Each gives a different layer of context:

### 1. Concept and architecture docs

| File | What it gives |
|---|---|
| `docs/API.md` | The endpoints of the module: paths, methods, bodies, rules, status codes |
| `docs/DATA_SHAPE.md` | The entities, their fields, enums, and relationships |
| `docs/architecture/web-app.md` | How the screens read the data, which files hold what |
| `docs/architecture/web-app-modules.md` | Module list, import order, entity links, kinds of file, `@x` pattern |

### 2. Shared code and shared modules

Read the exports of these to know what you can reuse:

| What | Path | Why |
|---|---|---|
| API helpers | `src/shared/api/request/` | `apiRequest`, `fetchPage`, `ListPage` |
| Query client | `src/shared/api/query-client/` | `cursorPagesOptions`, `HookQueryOptions`, `pageItems` |
| Endpoints registry | `src/shared/api/endpoints/` | `apiEndpoints` - add the new endpoints here |
| Mock HTTP helpers | `src/mocks/shared/http/` | `paginate`, `created`, `accepted`, `invalidState`, `validationFailed`, `readBodyFields`, `idempotent`, `pathParam`, `queryOf`, `hasMatchingParam` |
| Mock validation readers | `src/mocks/shared/http/validation/` | `choice`, `choiceProblem`, `requiredText`, `requiredTextProblem`, `optionalText`, `optionalTextProblem`, `jsonObject`, `jsonObjectProblem`, `positiveInteger`, `positiveIntegerProblem` |
| Mock db | `src/mocks/shared/db/` | `mockId`, `IdPrefix`, `mockNow`, `mockState` |
| Mock scenario | `src/mocks/shared/scenario/` | `answerScenario`, `pageUrlParam` |
| Shared lib | `src/shared/lib/` | guards (isRecord, isOneOf, hasText), url (pathWithQuery), values (clamp, omit) |
| Existing `@x` files | `src/modules/*/entities/@x/` | What other modules export to their consumers |

Also grep the module's current exports (if it exists on `main`) to see what is already there and what needs adding.

### 3. Plan templates

| File | What to copy from it |
|---|---|
| `docs/frontend-implementation-plan.md` | The overall sequence: which PR comes next, what it depends on, the "As built" notes from previous PRs |
| `docs/frontend-e5-review-plan.md` | The shape of an entity plan: sections, tables, naming rules, commit sequence, checklist |

### 4. Source branch to copy from

If the plan says "Copy from `feat/fe/mock`", read the files with `git show origin/feat/fe/mock:frontend/src/<path>`. List exactly what changes in each copy (imports, names, paging, scenario helper).

## What to write in the plan

The plan has these sections, in this order. Copy the structure of the E5 plan exactly:

### 1. Row in the PR table

Branch name (`feat/fe/<module>-entities`), PR title, what it needs (merged PRs), what comes after, docs-first notes.

### 2. What was read

Table of every source consulted, with what it gave this PR.

### 3. Decisions

Numbered list. Each decision states the rule and why. Cover:
- File structure (one resource = files by kind at the slice root; multiple resources = folders by kind; topics for run/workflow)
- Naming for API functions, hooks, key factories, mock reads
- What is NOT copied from `feat/fe/mock` and why
- What is extracted to shared code (the "three copies" rule)

### 4. Scope

The endpoints covered, what is copied from where, what is written new, what is not copied and why.

### 5. Naming

Table with the rule and the chosen name for each part (API function, query hook, hook file, key factory, request body, list of values, filter, page size, mock reads, mock refusals, mock store).

### 6. Shared code first

Two tables:
- **Reuse**: what existing helper to use, from where, for what
- **Extract before new code**: if a third copy of something appears, extract it to shared code first (with the file path and why)

### 7. Changes to existing modules

Table of files that change, what changes, and which commit.

### 8. The entity, file by file

ASCII tree of the entity folder, then a table: each file, what it holds, what it reuses. Then a sketch of the types (TypeScript), the keys, and the hooks (JSDoc included).

### 9. The mock, file by file

ASCII tree of the mock folder, then a table: each file, what it holds, what it reuses. Then:
- Rules for the mock data (fixtures vs derived, what the store keeps)
- The validation rules (from the API doc, NOT from the app's rules)
- The handler flow (in the order: `answerScenario`, record, checks, change, answer)
- The mock scenarios (what URL parameter shows what state)

### 10. Tests

Table of test files, each with its cases. Every reader and handler has cases for what it refuses.

### 11. Docs to update

Which docs change in the PR (web-app-modules, web-app, frontend README, mocks README).

### 12. Left for the next PRs

What this PR deliberately does not build (features, screens, mock improvements that belong to later PRs).

### 13. Commits and checks

Numbered list of commits (one-line messages, in order). The mock comes before the API functions so the entity tests pass on each commit. Then the checks: ESLint, Prettier, Vitest on specific folders, typecheck once.

### 14. Checklist

Tickable items for the user and the agent to verify before opening the PR.

## Rules to follow while writing

1. **No business logic in shared code.** If a helper is free of domain, it can go to `shared/lib/`. If it names an object of the product, it stays in the module that owns it.
2. **The mock does not repeat a mistake of the app.** Validators are written from the API doc, not from the app's form rules.
3. **Every decision is prescriptive.** Write "do X", not "consider X". The agent applies, it does not choose.
4. **Short paths convention.** `review/entities/...` means `frontend/src/modules/review/entities/...`. `mocks/...` means `frontend/src/mocks/...`. State this at the top.
5. **ASCII-only prose.** No em dashes, no arrows, no emoji. Vietnamese letters allowed.
6. **Commit messages: one line, conventional-commit form, no AI attribution.**
