# Assets

The animated assets of the app, as source files. Each folder here is one asset, made with the Rive
CLI: its text files (`scene.rml`, scripts, shaders) are the source, and `public/assets/<name>.riv`
is the file that the page loads.

- `agents/` - the face of an agent: an outline for each face made by hand, blobs of color, two
  eyes. Everything that changes (the mood, where the eyes look, the colors, the faces) is a property
  of its view model, written by `LiveFace`; the file only draws it and blinks.

The faces are drawn by this file only when the interface asks for it (`FaceStyleProvider` with
`style="live"`). By default they are drawn in CSS, which needs nothing from this folder. Today
that switch is on the design system page of the developer view (`/design-system`, on the
`dev.localhost` host).

## What you need

| To                                                                                                  | You need                           | An account |
| --------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- |
| Run the app, with the faces drawn from the file in `public/assets/`                                 | `pnpm install`                     | no         |
| Edit an asset and see it in a window                                                                | the Rive CLI                       | no         |
| Edit an asset and see it in the app, without building the file                                      | the Rive CLI and one setting       | no         |
| Build the file that goes into `public/assets/` (and be allowed to remove the splash screen of Rive) | the Rive CLI, `rive login`, a plan | yes        |

Everything that happens on your machine is free and needs no account: the preview window, the
checks, the screenshots and the live link. Only `--publish` and `--rev` need to be signed in.

## Set up from scratch

```bash
# 1. The app and the player of the files (a dependency of the app, installed by pnpm).
cd frontend
pnpm install

# 2. The Rive CLI, once per machine. macOS and Linux:
curl -fsSL https://releases.rive.app/cli/install.sh | sh
echo 'export PATH="$HOME/.rive/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc   # or ~/.bashrc
# Windows (PowerShell): irm https://releases.rive.app/cli/install.ps1 | iex
# Homebrew: brew install --cask rive-app/tap/rive-cli

# 3. Check it.
rive doctor
```

`rive doctor` may warn that you are not logged in, that there is no `adb` or no Xcode. None of
that matters here.

## Edit an asset and see it in the app

The Rive CLI can send each file it builds to the app, so that nothing has to be built into
`public/` while you work.

1. Tell the app where the live link is. In `frontend/.env.local` (git-ignored):

   ```bash
   NEXT_PUBLIC_ANIMATION_LIVE_LINK=ws://localhost:9640
   ```

   The port is the default of the CLI; if you change it with `--serve=<port>`, change it here.
   The setting is read when the dev server starts, so restart the dev server after it changes. It
   is ignored in production builds.

2. In one terminal, serve the asset:

   ```bash
   cd frontend/assets
   rive agents --serve          # a window that rebuilds on every save, and sends each build to the app
   # or, with no window:
   rive agents --headless-serve
   ```

3. In another terminal, run the app:

   ```bash
   cd frontend
   pnpm dev:mock                # or pnpm dev
   ```

4. Open the design system page of the developer view, `http://dev.localhost:3000/design-system`,
   and choose `live` in the card of the faces.

Now edit `assets/agents/scene.rml` and save: the faces on the page start over with the new file
within a few seconds. No account, no build, and the splash screen of Rive does not come into it,
because the file is not a published one.

How it works: the CLI keeps a WebSocket on `localhost` and sends it the file each time it builds
one. `useLiveFile` (`src/shared/lib/live`) keeps one connection for the whole page, and each face
starts over when a new file arrives. The messages of the link are not documented by Rive: if a
newer CLI changes them, the page keeps the file it has, and `fileOfMessage` is the one place to
fix.

## Edit an asset in a window only

```bash
cd frontend/assets
rive agents                    # the window; leave it running and save files
rive agents --verify           # compile without writing anything; exit 1 on errors
rive inspect agents --summary  # what the file really contains, and what is wired wrong
rive agents --screenshot=out.png --advance=1s          # one frame, no window
rive agents --screenshot=out.png --advance=100ms --data=mood=happy --advance=1s
```

Run `--verify` and `inspect` after every edit: a file can build clean and still be wired to
nothing, and neither of them looks at a pixel, so render it too. `rive docs` is the manual,
`rive schema <Type>` looks up a type, and the folder has its own `AGENTS.md` for a coding agent.

Edit `scene.rml` in place. Do not write a program that prints it: a rewrite loses what the file
gained since (the ids that `rive push` and the Editor write into it).

## Build the file that the page loads

Only when an asset is ready for the others, or for production.

```bash
rive login                     # once; the token is kept outside the repo
cd frontend/assets
rive agents --publish --output-dir=../../public/assets
```

Commit the new `public/assets/agents.riv` with the source, so that nobody else has to build it.

- Each publish counts toward the monthly allowance of the plan of the workspace (50 on Free, 500
  on Cadet), also when it is only to try the file in the app. Use the live link above to try.
- A file is signed only when it has scripts (Luau); without them the CLI says so and writes an
  unsigned file, which is fine for the web.
- **The splash screen.** On the Free plan the published file plays a splash screen of Rive: a
  black square with a small mark that covers the face for the first seconds (about three, in a
  test) before the face shows. A paid plan builds the file without it. Until the file in
  `public/assets/` is built on a paid plan, do not draw the faces of a production build with it.
  The live link is not affected.

## Open an asset in the Rive Editor

```bash
rive agents --rev=agents.rev   # writes a file for the Editor; needs rive login
```

Open the `.rev` in the Rive Editor (the desktop app or the browser). The CLI can also upload a
project to the account with `rive push`, which counts toward the allowance. Pick one place to edit
a file: the Editor and `scene.rml` do not merge.

## Fix

| What you see                                   | Why                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faces stay plain, the page asks for no file    | The card is on `plain`; choose `live`                                                                                                                                            |
| Faces do not follow your edits                 | The dev server was not restarted after the setting; the serve command is not running or uses another port; check that `rive agents --serve` prints `serving builds on port 9640` |
| `rive: command not found`                      | `~/.rive/bin` is not on the `PATH` (step 2)                                                                                                                                      |
| `Not logged in. Run: rive login`               | You ran `--publish` or `--rev`; the other commands need no account                                                                                                               |
| A black square for a few seconds on every face | The splash screen of the Free plan, see above                                                                                                                                    |
| Faces blank, console says `Bad header`         | The file is not a Rive file: a live link message that the page did not understand, or an old file in `public/assets/`                                                            |
