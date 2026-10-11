# Codespace and devcontainer

`devcontainer.json` defines the development environment used by GitHub Codespaces and by VS Code
"Reopen in Container". It contains only what the project needs, so every contributor gets the same
setup. Personal preferences (theme, font, personal extensions, dotfiles) are not set here.

## What it sets up

| Item | Value |
|---|---|
| Base image | Node 22 (Debian bookworm) |
| Python | 3.12 (devcontainer feature) |
| Tools | pnpm (corepack), uv, just (pipx), Docker-in-Docker |
| Minimum machine | 2 cores, 8 GB RAM |
| Forwarded ports | 3000 (Next dev server), 8000 (API server) |
| Extensions | Python, Ruff, mypy, just, ESLint, Prettier, Tailwind CSS, GitHub Actions, DBML, Draw.io |
| Editor settings | The project settings that `.vscode/` would hold (that folder is gitignored): ESLint working directory, Tailwind config file, watcher and search excludes, formatters |

Lifecycle:

- `onCreateCommand`: runs once when the codespace is created; enables corepack and installs uv and just.
- `updateContentCommand`: runs after creation and whenever the repo content is updated (prebuilds); runs `pnpm install --frozen-lockfile` in `frontend/`.
- A stopped codespace keeps its disk, so resuming it runs nothing again. Start the servers by hand.

## Create and use a codespace

Authorize `gh` once: `gh auth refresh -h github.com -s codespace`.

```bash
gh codespace create -R nhinguyen140809/khoai-lang-graph -b <branch> -m basicLinux32gb
gh codespace list
gh codespace code        # open in VS Code desktop
gh codespace ssh         # open a terminal
gh codespace ports       # list forwarded ports and their URLs
gh codespace stop        # stop it when done, a stopped codespace uses no compute quota
gh codespace delete      # remove it (unpushed work is lost)
```

Run the app inside the codespace, for example `cd frontend && pnpm dev`, then open the forwarded
URL of port 3000 in any browser. Hot reload works through the forwarded port.

A codespace stops by itself after 30 minutes without activity (configurable in GitHub settings,
Codespaces). Push your work before you stop or delete it.

## Machine sizes and upgrading

| Machine name | Cores | RAM | Use for |
|---|---|---|---|
| `basicLinux32gb` | 2 | 8 GB | Frontend work, light backend work (default) |
| `standardLinux32gb` | 4 | 16 GB | Backend plus the infra stack, type-aware lint on a large codebase |
| `premiumLinux` | 8 | 32 GB | Heavy experiments and evaluation runs |

The names and sizes follow what `gh codespace create` offers; run it without `-m` to list the
options available to your account. A free personal account has a monthly quota of core-hours
(a 2-core machine runs for twice as many hours as a 4-core one), so stop codespaces you do not use.

Change the machine of an existing codespace (it keeps its files; it restarts on the new size):

```bash
gh codespace stop
gh codespace edit -m standardLinux32gb
```

Raise the minimum for everyone by editing `hostRequirements` in `devcontainer.json`.

## Changing the environment

1. Edit `devcontainer.json` (add a feature, extension, setting, port or command).
2. In a running codespace, run the VS Code command "Codespaces: Rebuild Container". From the CLI:
   `gh codespace rebuild`.
3. Commit the change on a branch and open a PR. Existing codespaces pick it up on their next rebuild.

If the lockfile changes after a `git pull`, run `cd frontend && pnpm install` (or rebuild the
container) in a codespace that was already running.

## Personal setup

Anything that is only your preference stays out of this folder:

- Dotfiles: enable "Automatically install dotfiles" in GitHub Settings, Codespaces, and point it at
  your own dotfiles repo. Codespaces runs the `install.sh` in that repo when a codespace is created.
  It only applies to your own codespaces, never to a collaborator's.
- Theme, font and personal extensions: turn on VS Code Settings Sync with your GitHub account.
