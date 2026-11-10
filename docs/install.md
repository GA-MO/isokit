# Install iso by hand

`npx skills add GA-MO/isokit` in the [README](../README.md#install) covers most agents. Use this page when you want a git clone you can `git pull`, a copy committed to one repo, or an agent the CLI does not place where the agent reads.

`iso` is an Agent Skill: the `skill/` folder with its `SKILL.md`. Every tool needs it installed as a folder named `iso`, because several of them require the folder name to match the skill's `name`. Nothing else needs installing: the skill's checks install their own packages into `iso/scripts/node_modules` the first time they run. Every path and command here comes from each tool's official docs, checked on 2026-11-10; the pages are listed in [install-sources.md](install-sources.md).

## Claude Code

```sh
git clone https://github.com/GA-MO/isokit.git
mkdir -p ~/.claude/skills
ln -s "$PWD/isokit/skill" ~/.claude/skills/iso
```

If `~/.claude/skills/iso` already exists, move it away first, or the link lands inside it. Claude Code picks up the skill in a running session. If `~/.claude/skills` did not exist when the session started, run `/reload-skills`. Type `/iso`, or ask `What skills are available?`. For one repo only, copy the folder to `.claude/skills/iso` and commit it. A `git pull` in the clone updates a linked skill.

For updates without a clone, install the plugin instead: `claude plugin install iso --marketplace GA-MO/isokit` (see the README).

## Claude app (claude.ai and the desktop app)

The README's steps upload the `iso.zip` attached to each release. To build the same file from a clone, run `sh scripts/zip.sh` at the repo root. It writes `iso.zip` with the `iso` folder at its top level and fails if any entry is outside `iso/` or `iso/SKILL.md` is missing. Check it with `unzip -l iso.zip`: every line should start with `iso/`.

Scripts run in Claude's code sandbox. Depending on your settings it may have no network, and then the checks report that they were skipped while rendering still works.

## Codex (CLI, IDE extension, ChatGPT desktop app)

```sh
git clone --depth 1 https://github.com/GA-MO/isokit.git
mkdir -p ~/.agents/skills
cp -R isokit/skill ~/.agents/skills/iso
```

Codex detects new skills on its own. Restart it if `iso` doesn't show. In the CLI or IDE extension, run `/skills` or type `$` to pick `iso`. In the ChatGPT desktop app, open Skills in the sidebar. For one repo, use `.agents/skills/iso`.

## Cursor

Use the same commands as Codex (`~/.agents/skills/iso`). Restart Cursor, then open Customize in the sidebar and go to Skills, or type `/` in Agent chat. For one repo, use `.agents/skills/iso` (or `.cursor/skills/iso`).

## Gemini CLI

Use the same commands as Codex: Gemini CLI reads `~/.agents/skills` as an alias of `~/.gemini/skills`. In a session, run `/skills reload`, then `/skills list`. From the terminal, run `gemini skills list --all`. For one repo, use `.agents/skills/iso`. Its docs say Antigravity CLI replaced it on 18 June 2026.

## Antigravity

Antigravity's app, CLI and IDE read `.agents/skills` only inside a workspace, so `npx skills add GA-MO/isokit -g` does not reach them. Install for every workspace by copying the folder:

```sh
git clone --depth 1 https://github.com/GA-MO/isokit.git
mkdir -p ~/.gemini/config/skills
cp -R isokit/skill ~/.gemini/config/skills/iso
```

For one workspace, run `npx skills add GA-MO/isokit -a antigravity` in it, which writes `.agents/skills/iso`. In the CLI, run `/skills reload` or start a new conversation. In the IDE, open the Customizations menu in the agent side panel.

## GitHub Copilot (CLI, VS Code, cloud agent)

Use the same commands as Codex (`~/.agents/skills/iso`; `~/.copilot/skills/iso` works too).

- Copilot CLI: run `/skills reload`, then `/skills list` in a session, or `copilot skill list` in the terminal.
- VS Code: type `/` in a new chat, run `/skills`, or run Chat: Open Customizations and select Skills.
- Cloud agent: commit the skill to the repo (`.github/skills/iso`, `.claude/skills/iso` or `.agents/skills/iso`), or put it in `.copilot/skills` in your dotfiles repo.

## Devin Desktop (formerly Windsurf)

Use the same commands as Codex: Devin Desktop reads `~/.agents/skills` next to its own `~/.config/devin/skills`. Click Customize in the agent sidebar and open the Skills tab, or type `/iso`. For one repo, use `.agents/skills/iso` (`.devin/skills` and the legacy `.windsurf/skills` work too).

## opencode

Use the same commands as Codex. opencode also reads `~/.config/opencode/skills` and `~/.claude/skills`. If `iso` is missing, check that no rule in the `permissions` array of `opencode.json` with `"action": "skill"` and `"effect": "deny"` matches it; the last matching rule wins. For one repo, use `.agents/skills/iso`.

## goose, Amp, Junie, Kiro

goose, Amp and Junie read `~/.agents/skills`, so use the same commands as Codex. Check with `goose skills list`, `amp skills list`, or `/skills` in Junie. Junie reads a project's `.agents/skills` only when the project is trusted. Kiro reads `~/.kiro/skills`, and only in the IDE:

```sh
mkdir -p ~/.kiro/skills
cp -R isokit/skill ~/.kiro/skills/iso
```

Then find it under Agent Steering & Skills in the Kiro panel, or type `/` in chat.

## Committing it to a repo

Copy the folder into the repo's skills folder for your agent and commit it, so everyone on the repo gets it. Keep `scripts/node_modules` out of git: it holds the packages and browsers the checks install.

```sh
git clone --depth 1 https://github.com/GA-MO/isokit.git ../isokit
mkdir -p .agents/skills
cp -R ../isokit/skill .agents/skills/iso
echo '.agents/skills/iso/scripts/node_modules/' >> .gitignore
```

## Update a copy

Copy it over again: `cp -R isokit/skill/. ~/.agents/skills/iso/` after a `git pull` in the clone. A linked skill (Claude Code above) updates with the `git pull` alone.
