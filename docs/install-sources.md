# Install sources

Every path, command and menu name in `site/src/install.ts` comes from the official page listed under its tool. All pages were checked on 2026-11-06. Quotes are short extracts from the page as fetched that day.

The skill folder in this repo is `skill/`, but its frontmatter says `name: iso`. Several tools require the folder name to match `name` (Claude app uploads, opencode, VS Code, Kiro), so every step installs the folder as `iso`.

Only Claude Code and Codex document that they follow a symlinked skill folder. For every other tool the steps copy the folder instead of linking it.

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
  - States a 200-character description limit, which conflicts with the 1,024 above. `iso`'s description is 474 characters. See Open risks.

## Codex (CLI, IDE extension, ChatGPT desktop app)

- https://learn.chatgpt.com/docs/build-skills (`https://developers.openai.com/codex/skills` redirects here with a 308)
  - User: "`$HOME/.agents/skills`". Repo: "`$CWD/.agents/skills`", "`$REPO_ROOT/.agents/skills`"; Codex scans `.agents/skills` from the current directory up to the repo root.
  - Symlinks: "Codex supports symlinked skill folders and follows the symlink target when scanning these locations."
  - Check: run `/skills` or type `$` in the CLI or IDE extension; in the ChatGPT desktop app open Skills in the sidebar.
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
  - Notice: "Unpaid tier and Google One users: Gemini CLI was replaced by Antigravity CLI on June 18th, 2026."
  - User: "Located in `~/.gemini/skills/` or the `~/.agents/skills/` alias." Workspace: `.gemini/skills/` or `.agents/skills/`.
  - Check: `/skills list`, or `gemini skills list --all` in the terminal. Reload: `/skills reload`.
  - Also documents `gemini skills install <git url> --path <dir> --scope user|workspace --consent` and `/skills link <path>`. Not used: the page does not say what folder name an install from a subdirectory gets, and `name` must be `iso`.
  - Symlinks are not mentioned.

## Antigravity (app, CLI, IDE)

- https://antigravity.google/docs/skills
  - Workspace: `<workspace-root>/.agents/skills/<skill-folder>/` for all three products.
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
  - Name: "Match the directory name that contains `SKILL.md`".
  - Check: "OpenCode lists available skills in the `skill` tool description." Permissions in `opencode.json` (`allow`, `deny`, `ask`) can hide a skill.

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

- Claude app upload: the help article caps the description at 200 characters and rejects "Invalid characters in skill name or description". `iso`'s description is 474 characters and contains Thai text and quotes. The newer docs page says 1,024 characters. Nobody has uploaded `iso.zip` to a real account yet.
- Tools that do not document symlinks may still follow them; the copy steps work either way.
