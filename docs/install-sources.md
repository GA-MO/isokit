# Install sources

Every path, command and menu name in the README's Install section, `docs/install.md` and `site/src/install.ts` comes from the official page listed under its tool. All pages were checked again on 2026-11-10 (first on 2026-11-06). Quotes are short extracts from the page as fetched that day. Lines marked *measured* were run on 2026-11-10 in a temporary HOME or project against the `gamo/install-best-practice` branch on GitHub.

The skill folder in this repo is `skill/`, but its frontmatter says `name: iso`. Several tools require the folder name to match `name` (Claude app uploads, opencode, VS Code, Kiro), so every step installs the folder as `iso`.

Only Claude Code and Codex document that they follow a symlinked skill folder. For every other tool the manual steps copy the folder instead of linking it.

## skills CLI (`npx skills add`)

- https://github.com/vercel-labs/skills
  - "Requires Node.js 22.20 or later."
  - Scope: "Skills are installed to the current project by default; add `-g` to make them available across projects."
  - Telemetry: "The CLI collects anonymous usage data." "Set `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` to disable telemetry and security-audit requests."
- https://github.com/vercel-labs/skills/blob/main/docs/agents.md: agent ids `claude-code`, `codex`, `cursor`, `gemini-cli`, `github-copilot`, `opencode`, `antigravity`, `goose`, `amp`, `junie`, `kiro-cli`, `devin`, `windsurf`.
- *Measured* (`skills` from npm, `npx skills --help` for flags):
  - `npx skills add GA-MO/isokit --list` finds one skill, `iso`, with no change to the repo. `owner/repo#<branch>` picks a branch; a `/tree/<branch>` URL fails when the branch name holds a slash.
  - `-g -a claude-code codex -y` writes the folder to `~/.agents/skills/iso` (Codex reads it) and links `~/.claude/skills/iso` to it.
  - `-g -a cursor gemini-cli antigravity antigravity-cli github-copilot opencode amp` writes only `~/.agents/skills/iso`. `-g -a devin windsurf goose junie kiro-cli` also links `~/.config/devin/skills/iso`, `~/.codeium/windsurf/skills/iso`, `~/.config/goose/skills/iso`, `~/.junie/skills/iso` and `~/.kiro/skills/iso`. agents.md gives `~/.gemini/config/skills/` as Antigravity's global path, but the CLI did not write there, and Antigravity does not read `~/.agents/skills` globally (see Antigravity below). So the README sends Antigravity users to a project install or a copy.
  - The installed folder holds every committed file of `skill/`: `SKILL.md`, `recipes.md`, `lib/`, `examples/`, `scripts/`, `tsconfig.json`, `.claude-plugin/`.
  - `npx skills update -g -y` and `npx skills ls -g` work on that install.

## Claude Code plugin marketplace

- https://code.claude.com/docs/en/plugin-marketplaces: `.claude-plugin/marketplace.json` "requires a `name`, an `owner`, and a `plugins` array"; each entry "needs a `name` and a `source`", a relative source written "from the marketplace root". "Keep the entry name and the manifest name the same." `claude plugin validate`, `claude plugin marketplace add <owner>/<repo>`, `claude plugin install <plugin>@<marketplace>`.
- https://code.claude.com/docs/en/plugins/manifest-reference: `name` is the only required key of `plugin.json`. "A plugin with `SKILL.md` at its root, no `skills/`, and no `skills` key loads as a single skill", which is why the entry's source is `./skill`. Setting `version` "keeps users on that version until you change it".
- https://code.claude.com/docs/en/plugins/host-marketplace: "Background auto-update is off for your marketplace by default"; users turn it on in **Marketplaces** in `/plugin`, "**Enable auto-update**", or run `claude plugin update <plugin>@<name>`. "Omit `version`: users track your commits instead." `#<ref>` on the add command pins a branch or tag. Users with no GitHub SSH key can set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.
- *Measured* with Claude Code 2.1.312: `claude plugin validate .` and `claude plugin validate ./skill` pass with one warning each, the missing `version`, which is left out on purpose so installs follow commits. The validator's advice names the one-step `/plugin install iso --marketplace <owner>/<repo>` for Claude Code 2.1.275 or later. `claude plugin install iso --marketplace "GA-MO/isokit#gamo/install-best-practice"` added the `isokit` marketplace and installed `iso@isokit` with version `aeb29620ccb8` (the commit), skills `iso`.

## Claude API and claude.ai sandboxes

- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - `description`: "Maximum 1,024 characters", "Cannot contain XML tags". `name`: lowercase letters, numbers and hyphens, at most 64.
  - Claude API: "No network access", "No runtime package installation". claude.ai: "Skills might have full, partial, or no network access". Claude Code: "Global package installation discouraged: Skills should only install packages locally".

## Node

- *Measured* with the official darwin-arm64 builds from nodejs.org: `node scripts/render.ts examples/notifications.ts` runs on 22.18.0, 23.6.0, 24.0.0 and 25.0.0 and writes the same bytes as Bun. 20.19.5, 22.17.1 and 23.5.0 stop with `ERR_UNKNOWN_FILE_EXTENSION`; 22.6.0 and 22.17.1 run it with `--experimental-strip-types`. 23.6.0 and 24.0.0 print an `ExperimentalWarning` for type stripping; 22.18.0 and 25.0.0 do not.

## Claude Code

- https://code.claude.com/docs/en/skills
  - Personal: "`~/.claude/skills/<skill-name>/SKILL.md`", for "All your projects on this machine".
  - Project: "`.claude/skills/<skill-name>/SKILL.md`", "Commit it so your team gets it too".
  - Symlinks: "a `<skill-name>` entry in the enterprise, personal, or project location can be a symlink to a directory elsewhere on disk."
  - Live reload: "Claude Code watches skill directories for file changes ... picks up the change within the current session, without a restart." Exception: "If you create a top-level skills directory that didn't exist when the session started, run `/reload-skills`."
  - Check: "Verify the skill appears in `What skills are available?`" and "invoke it directly with `/skill-name`".

## Claude app (claude.ai and the desktop app)

- https://support.claude.com/en/articles/12512180-using-skills-in-claude
  - Plans: "Skills are available for users on Free, Pro, Max, Ultra, Team, and Enterprise plans."
  - Enable: Settings > Capabilities, "Code execution and file creation", "called **Create and edit files** in the updated Settings layout". Team and Enterprise: Organization settings > Plugins & skills > Policy, with "Cloud code execution and file creation" and "Skills" on.
  - Upload: Customize > Skills, the "+" button, "+ Create skill", "Upload a skill", "Upload a ZIP file containing your skill folder."
  - Upload failures it lists: "ZIP file exceeds size limits", "Skill folder name doesn't match the skill name", "Missing required skill.md file", "Invalid characters in skill name or description".
- https://claude.com/docs/skills/how-to
  - ZIP shape: "The ZIP must contain the skill directory itself as its top level, because Claude looks for `<skill-name>/SKILL.md` inside the archive".
  - Check the archive: "List the archive and check that every entry starts with `my-skill/`" with `unzip -l`.
  - Both apps: "Go to **Customize > Skills** in claude.ai or the desktop app and turn the skill on."
  - Scripts: "in chat on claude.ai it's what the code-execution environment provides."
  - Name: "Must match the skill's directory name". Description: "Up to 1,024 characters".
- https://support.claude.com/en/articles/12512198-how-to-create-custom-skills (read, not linked from the site)
  - States "(200 characters maximum)" for the description, which conflicts with the 1,024 above. See Open risks.

## Codex (CLI, IDE extension, ChatGPT desktop app)

- https://learn.chatgpt.com/docs/build-skills (`https://developers.openai.com/codex/skills` redirects here with a 308)
  - User: "`$HOME/.agents/skills`". Repo: "`$CWD/.agents/skills`", "`$REPO_ROOT/.agents/skills`"; Codex scans `.agents/skills` from the current directory up to the repo root.
  - Symlinks: "Codex supports symlinked skill folders and follows the symlink target when scanning these locations."
  - Pick a skill: "run `/skills` or type `$` to mention a skill" in the CLI or IDE extension; in the ChatGPT desktop app open Skills in the sidebar.
  - Reload: "Codex detects skill changes automatically. If an update doesn't appear, restart Codex."
  - Surfaces: available "in the ChatGPT desktop app, Codex CLI, and IDE extension".

## Cursor

- https://cursor.com/docs/context/skills
  - Project: `.agents/skills/`, `.cursor/skills/`. User: `~/.agents/skills/`, `~/.cursor/skills/`.
  - "For compatibility, Cursor also loads skills from Claude and Codex directories": `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, `~/.codex/skills/`.
  - Discovery: "When Cursor starts, it automatically discovers skills from skill directories."
  - Check: "open **Customize** in the sidebar and go to **Skills**"; type `/` in Agent chat and search for the skill.
  - No enable setting is mentioned. Symlinks are not mentioned.

## Gemini CLI

- https://geminicli.com/docs/cli/skills/
  - Notice: "Gemini CLI was replaced by Antigravity CLI on June 18th, 2026."
  - User: "Located in `~/.gemini/skills/` or the `~/.agents/skills/` alias." Workspace: `.gemini/skills/` or `.agents/skills/`.
  - Check: `/skills list`, or `gemini skills list --all` in the terminal. Reload: `/skills reload`.
  - Also documents `gemini skills install <git url> --path <dir> --scope user|workspace --consent` and `/skills link <path>`. Not used: the page does not say what folder name an install from a subdirectory gets, and `name` must be `iso`.
  - Symlinks are not mentioned.

## Antigravity (app, CLI, IDE)

- https://antigravity.google/docs/skills
  - Workspace: `<workspace-root>/.agents/skills/<skill-folder>/` for all three products; the app also reads "`.agents/skills/` in each parent folder up to the repository root". The page lists no global `~/.agents/skills`.
  - Global: `~/.gemini/config/skills/<skill-folder>/` for the app, CLI and IDE. CLI only: `~/.gemini/antigravity-cli/skills/` and `~/.gemini/skills/`. IDE legacy: `~/.gemini/antigravity/skills/`.
  - CLI: "If you add a skill while the CLI is running, run `/skills reload` or start a new conversation to update the slash commands."
  - IDE: "You can inspect all active skills from the **Customizations** menu in the agent side panel."

## GitHub Copilot (CLI, VS Code, cloud agent)

- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
  - Surfaces: "GitHub Copilot CLI", "Copilot cloud agent and Copilot code review on GitHub.com", "Agent mode in Visual Studio Code, Visual Studio, and JetBrains IDEs".
  - Project: "`.github/skills`, `.claude/skills`, or `.agents/skills`". Personal: "`~/.copilot/skills` or `~/.agents/skills`".
  - Cloud agent: personal skills go in `.copilot/skills` in your dotfiles repository; this "does not apply to GitHub Actions-based sessions".
- https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
  - Check: `/skills list`, `/skills info SKILL-NAME`, `copilot skill list`. Reload: `/skills reload`.
  - Also documents `copilot skill add <FILE | URL | DIRECTORY>`. Not used, for the same folder-name reason as Gemini CLI.
- https://code.visualstudio.com/docs/copilot/customization/agent-skills
  - Project: `.github/skills/`; local sessions also read `.claude/skills/` and `.agents/skills/`. Personal: `~/.copilot/skills/`; local sessions also read `~/.claude/skills/` and `~/.agents/skills/`.
  - Check: "Type `/` in the chat input field to see available skills and prompts", `/skills` opens Configure Skills, or Chat: Open Customizations then Skills.
  - Name: "Must match the parent directory name."

## Devin Desktop (formerly Windsurf)

- https://docs.devin.ai/desktop/cascade/skills (`https://docs.windsurf.com/windsurf/cascade/skills` redirects here)
  - Workspace: `.devin/skills/<name>/`; also reads `.agents/skills/` and the legacy `.windsurf/skills/`.
  - Global: `~/.config/devin/skills/<name>/`; also reads `~/.agents/skills/`.
  - Check: Customize in the agent sidebar, Skills tab, which "lists what the agent has loaded". Run with `/skill-name`.
- https://docs.devin.ai/desktop/devin-desktop-faq
  - "Devin Desktop is the new name for Windsurf."

## opencode

- https://opencode.ai/docs/skills/
  - Project: `.opencode/skills/`, `.claude/skills/`, `.agents/skills/`, checked "from the current directory up to the git worktree". Global: `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/`.
  - The skill ID "comes from the file path"; keep it "aligned with the directory name".
  - Permissions: rules in a `permissions` array with `"action": "skill"`; "`deny` hides the skill from the model and blocks loading", and the last matching rule wins.

## More agents tab

- goose: https://goose-docs.ai/docs/guides/context-engineering/using-skills. Global `~/.agents/skills/`, project `.agents/skills/`. "This functionality uses the built-in Skills platform extension, which is enabled by default." Check: `goose skills list`.
- Amp: https://ampcode.com/docs/customize/skills. User: `~/.config/agents/skills/`, `~/.agents/skills/`, `~/.config/amp/skills/`, `~/.claude/skills/`. Project: `.agents/skills/`, `.claude/skills/`. Check: `amp skills list`.
- Junie: https://junie.jetbrains.com/docs/agent-skills.html. User `~/.junie/skills/`, project `.junie/skills/`; cross-agent `~/.agents/skills/` and `.agents/skills/` ("only in a trusted project"). Check: `/skills`.
- Kiro: https://kiro.dev/docs/skills/. Workspace `.kiro/skills/`, global `~/.kiro/skills/` ("available in the IDE only"). Check: Agent Steering & Skills in the Kiro panel, or `/` in chat. Name "Must match folder name."

## Where the tool list came from

- https://agentskills.io/clients (client showcase of the open format; its links led to the goose, Amp, Junie and Kiro pages above)

## Left out

- The other clients in the showcase (for example Roo Code, OpenHands, Factory, Letta, Tabnine): each has its own docs, but the site already has ten tabs, and goose, Amp, Junie and Kiro cover the common CLI and IDE cases. Most of the rest read `~/.agents/skills` too, so the Codex or More agents steps likely apply; I did not verify them one by one.
- Goose's older docs at block.github.io now return 404; the current page is goose-docs.ai.

## Open risks

- Claude app upload: https://support.claude.com/en/articles/12512198-how-to-create-custom-skills still says "(200 characters maximum)" for the description on 2026-11-10, while the platform docs say 1,024. `iso`'s description is 485 characters, English only since 2026-11-10. *Measured*: in a project with only this skill, the 485-character description loaded `iso` first for all five test prompts (two Thai, three English). Two descriptions cut under 200 characters each missed two of the five, among them a Thai prompt, so the long one stays. Nobody has uploaded `iso.zip` to a real account yet; if the upload refuses the description, that is where it would show.
- Plugin installs keep their checks' packages in the plugin's versioned folder, so each update installs them again on the first check run (about 53 MB of npm packages, more when a browser is downloaded).
- Tools that do not document symlinks may still follow them; the copy steps work either way.
