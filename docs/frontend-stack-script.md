# Frontend stack script

A tool for the review of the frontend stack: `scripts/git-stack` changes the history of the stacked branches with one command, instead of a manual `git rebase -i`, `git commit --amend` and a rebase of every branch above the change. The script and this note live on the `frontend-plan` branch only; neither goes to `main`.

## The stack

The script knows the S2a stack, bottom to top:

```text
docs/fe/activity
chore/fe/maintenance-before-activity
feat/fe/activity-entities
feat/fe/prompt-input
feat/fe/send-message-and-answer
feat/fe/activity
```

`GIT_STACK_BASE` and `GIT_STACK_BRANCHES` replace the base and the list, for a test or another stack: `GIT_STACK_BRANCHES="b1 b2 b3" GIT_STACK_BASE=main git-stack status`.

## Commands

| Command | What it does |
|---|---|
| `git-stack status` | The tip and the commit count of every branch, and whether each branch sits on top of the one below |
| `git-stack list` | The commits of the stack, oldest first, with the tip of each branch marked |
| `git-stack edit <commit>...` | Stops the rebase at each commit; edit the files, `git add` them, then run `git-stack continue` |
| `git-stack continue` | Amends the stopped commit, replays the rest, and moves the branches to their new tips; stops again at the next commit of the edit |
| `git-stack fixup <commit>` | Commits the staged changes as a fixup of one commit and squashes them into it, in one step |
| `git-stack autosquash <commit>...` | Squashes the fixup commits of these targets in one rebase, and moves the branches to their new tips |
| `git-stack sync` | Rebases each branch onto the one below it when that branch gained or changed a commit, and leaves the branches at their new tips |
| `git-stack abort` | Aborts the rebase in progress and forgets the edit |

`<commit>` is a SHA, a prefix of one, or part of the commit subject: `git-stack edit "delivery notes"`.

`edit` and `fixup` run from the top branch, since the rebase replays every branch above the commit. `sync` runs from any branch of the stack and returns to it at the end. The worktree must be clean, except for `fixup`, which takes the staged changes.

## Several commits

`edit` takes more than one commit. The rebase stops at each in the order of the history; every `continue` amends the stopped commit and moves to the next stop. After the last one, the script re-points the branches once.

```bash
git-stack edit "feat: one" "feat: four"
# edit, git add, git-stack continue; edit the second, git add, git-stack continue
```

For a fixup of several commits, create one fixup commit for each target with Git, then squash them in one rebase:

```bash
git add <the files of the first commit>
git commit --fixup=<first commit>
git add <the files of the second commit>
git commit --fixup=<second commit>
git-stack autosquash <first commit> <second commit>
```

`autosquash` needs at least one `fixup!` commit above the oldest target. The commits that start with `fixup!`, `squash!` or `amend!` are left out when a commit is looked up by its subject, so the target and its fixup do not read as two matches.

## A commit added to a lower branch

Only the branch directly above the changed branch needs a rebase. That rebase carries every commit of the branches above it, so those branches only move their tips to the new commits; they are not rebased one by one. `sync` does both steps, and it replays each branch whole: a branch of several commits keeps all of them.

The same holds when a commit of a lower branch is amended instead of added: the script rebases the branch above onto the new tip, starting from the old tip of the branch below, which it finds through the reflog of that branch, so the old commit is not replayed a second time.

## Using it from the main worktree

The script sits in this worktree, which holds the plan branch. From the main checkout, run it with its path:

```bash
/Users/nguyentranyennhi/projects/khoai-lang-graph-frontend-plan/scripts/git-stack status
```

Or put its folder on `PATH` and type `git stack ...`, since Git runs an external command named `git-stack`:

```bash
export PATH="/Users/nguyentranyennhi/projects/khoai-lang-graph-frontend-plan/scripts:$PATH"
git stack status
```

## Limits

- The history is linear: a merge commit in the stack is not handled.
- The branches are moved by matching the subject of their tip commit in the new history. Two commits with one subject make the match ambiguous; the script warns and leaves that branch for a manual move.
- A conflict stops the command. For `edit` and `fixup`, resolve the files, `git add` them, then run `git-stack continue` again. For `sync`, resolve, `git add`, run `git rebase --continue`, then `git-stack sync` again.
- The script holds no code of the app and no rule of the product; it is a note for the review, not part of the frontend.
