type NonEmpty<T> = readonly [T, ...T[]];
type Url = `https://${string}`;

/** One instruction. Text may hold `inline code` in backticks; `code` is a shell block with its own Copy button. */
export interface Step {
  text: string;
  code?: string;
}

/** An official docs page the steps were checked against. */
export interface Source {
  title: string;
  url: Url;
}

interface Base {
  name: string;
  note: string;
  steps: NonEmpty<Step>;
  sources: NonEmpty<Source>;
}

/** A tool that reads skill folders from disk: `personal` and `project` are the folders `iso/` goes in. */
interface FolderTool extends Base {
  kind: 'folder';
  personal: string;
  project: string;
}

/** A tool that takes the skill as an uploaded ZIP. */
interface UploadTool extends Base {
  kind: 'upload';
  where: string;
}

export type Tool = FolderTool | UploadTool;

const clone = 'git clone --depth 1 https://github.com/GA-MO/isokit.git';
const agents = '~/.agents/skills';

const copyTo = (dir: string): Step => ({
  text: `Clone the repo and copy its \`skill\` folder to \`${dir}/iso\`. If \`${dir}/iso\` already exists, move it away first, or the copy lands inside it.`,
  code: `${clone}\nmkdir -p ${dir}\ncp -R isokit/skill ${dir}/iso`,
});

const scripts = (dir: string): Step => ({
  text: 'Install the render, screenshot and type-check scripts the skill runs to check its own work. You need Bun; screenshots use your installed Google Chrome.',
  code: `cd ${dir}/iso/scripts && bun install`,
});

const project = (dir: string): Step => ({
  text: `For one repo only, copy it to \`${dir}/iso\` at the repo root instead and commit it, so everyone on the repo gets it. Keep \`scripts/node_modules\` out of git.`,
  code: `git clone --depth 1 https://github.com/GA-MO/isokit.git ../isokit\nmkdir -p ${dir}\ncp -R ../isokit/skill ${dir}/iso\ncd ${dir}/iso/scripts && bun install`,
});

const defs = {
  'claude-code': {
    kind: 'folder',
    name: 'Claude Code',
    note: 'Claude Code follows a symlinked skill folder, so a `git pull` in the clone updates the skill.',
    personal: '~/.claude/skills',
    project: '.claude/skills',
    steps: [
      {
        text: 'Clone the repo and link its `skill` folder to `~/.claude/skills/iso`. If `~/.claude/skills/iso` already exists, move it away first, or the link lands inside it.',
        code: `git clone https://github.com/GA-MO/isokit.git\nmkdir -p ~/.claude/skills\nln -s "$PWD/isokit/skill" ~/.claude/skills/iso`,
      },
      {
        text: 'Install the render, screenshot and type-check scripts the skill runs to check its own work. You need Bun; screenshots use your installed Google Chrome.',
        code: 'cd isokit/skill/scripts && bun install',
      },
      {
        text: 'Claude Code picks up the skill in a running session; if `~/.claude/skills` did not exist when the session started, run `/reload-skills`. Type `/iso`, or ask `What skills are available?` and look for `iso`.',
      },
      project('.claude/skills'),
    ],
    sources: [{ title: 'Claude Code skills', url: 'https://code.claude.com/docs/en/skills' }],
  },
  'claude-app': {
    kind: 'upload',
    name: 'Claude app',
    note: 'For chat on claude.ai and the desktop app. Its scripts run in Claude’s code sandbox with what that sandbox provides, so the Bun render and screenshot checks may not run there.',
    where: 'Customize > Skills',
    steps: [
      {
        text: 'Turn on code execution: Settings > Capabilities > `Code execution and file creation` (called `Create and edit files` in the newer settings). On Team and Enterprise plans an owner enables `Skills` under Organization settings > Plugins & skills > Policy.',
      },
      {
        text: 'Build `iso.zip` with the `iso` folder at its top level. Claude looks for `iso/SKILL.md` inside the archive, and the folder name must match the skill name. Every file `unzip -l` lists should start with `iso/`.',
        code: `${clone}\ncd isokit && git archive --format=zip --prefix=iso/ -o ../iso.zip HEAD:skill && cd ..\nunzip -l iso.zip`,
      },
      {
        text: 'Open Customize > Skills, click `+`, then `+ Create skill`, then `Upload a skill`, and choose `iso.zip`.',
      },
      {
        text: 'Turn `iso` on in Customize > Skills. Then ask for an isometric flow and check Claude’s thinking shows it loading the skill.',
      },
    ],
    sources: [
      { title: 'Using skills in Claude', url: 'https://support.claude.com/en/articles/12512180-using-skills-in-claude' },
      { title: 'Create custom skills', url: 'https://claude.com/docs/skills/how-to' },
    ],
  },
  codex: {
    kind: 'folder',
    name: 'Codex',
    note: 'Skills work in the Codex CLI, the IDE extension and the ChatGPT desktop app. Codex scans `.agents/skills` from the current folder up to the repo root.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Codex detects new skills on its own; restart it if `iso` does not show. In the CLI or IDE extension run `/skills` or type `$` to mention it. In the ChatGPT desktop app, open Skills in the sidebar.',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'Codex skills', url: 'https://learn.chatgpt.com/docs/build-skills' }],
  },
  cursor: {
    kind: 'folder',
    name: 'Cursor',
    note: 'Cursor finds skills when it starts. It also reads `~/.cursor/skills`, and the Claude and Codex folders for compatibility.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Restart Cursor so it finds the skill, then open Customize in the sidebar and go to Skills. In Agent chat, type `/` and search for `iso`.',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'Cursor skills', url: 'https://cursor.com/docs/context/skills' }],
  },
  'gemini-cli': {
    kind: 'folder',
    name: 'Gemini CLI',
    note: 'Gemini CLI reads `~/.agents/skills` as an alias of `~/.gemini/skills`. Its docs say Antigravity CLI replaced it for unpaid tier and Google One users on 18 June 2026.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Skills load when a session starts. In a running session, run `/skills reload`, then `/skills list`. From the terminal:',
        code: 'gemini skills list --all',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'Gemini CLI skills', url: 'https://geminicli.com/docs/cli/skills/' }],
  },
  antigravity: {
    kind: 'folder',
    name: 'Antigravity',
    note: '`~/.gemini/config/skills` is read by the Antigravity app, CLI and IDE alike.',
    personal: '~/.gemini/config/skills',
    project: '.agents/skills',
    steps: [
      copyTo('~/.gemini/config/skills'),
      scripts('~/.gemini/config/skills'),
      {
        text: 'In the CLI, run `/skills reload` or start a new conversation. In the IDE, open the Customizations menu in the agent side panel to see active skills.',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'Antigravity skills', url: 'https://antigravity.google/docs/skills' }],
  },
  copilot: {
    kind: 'folder',
    name: 'GitHub Copilot',
    note: 'Copilot CLI, agent mode in VS Code and the Copilot cloud agent read skills. For the cloud agent, commit the skill to the repo or put it in `.copilot/skills` in your dotfiles repo.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Copilot CLI: in a session run `/skills reload`, then `/skills list`. From the terminal:',
        code: 'copilot skill list',
      },
      {
        text: 'VS Code: start a new chat and type `/` to find `iso`, or run `/skills`, or run Chat: Open Customizations from the Command Palette and select Skills.',
      },
      project('.agents/skills'),
    ],
    sources: [
      { title: 'About agent skills', url: 'https://docs.github.com/en/copilot/concepts/agents/about-agent-skills' },
      { title: 'Copilot CLI skills', url: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills' },
      { title: 'VS Code agent skills', url: 'https://code.visualstudio.com/docs/copilot/customization/agent-skills' },
    ],
  },
  devin: {
    kind: 'folder',
    name: 'Devin Desktop',
    note: 'Devin Desktop is the new name for Windsurf. It reads `~/.agents/skills` next to its own `~/.config/devin/skills`, and still reads `.windsurf/skills` in a workspace.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Click Customize in the agent sidebar and open the Skills tab, which lists what the agent loaded. Type `/iso` to run it directly.',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'Devin Desktop skills', url: 'https://docs.devin.ai/desktop/cascade/skills' }, { title: 'Devin Desktop FAQ', url: 'https://docs.devin.ai/desktop/devin-desktop-faq' }],
  },
  opencode: {
    kind: 'folder',
    name: 'opencode',
    note: 'opencode also reads `~/.config/opencode/skills` and `~/.claude/skills`, and checks project folders from the current one up to the git worktree.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'opencode lists the skills it found in its `skill` tool, so ask it which skills it can load. If `iso` is missing, check that no `permission.skill` rule in `opencode.json` denies it.',
      },
      project('.agents/skills'),
    ],
    sources: [{ title: 'opencode skills', url: 'https://opencode.ai/docs/skills/' }],
  },
  others: {
    kind: 'folder',
    name: 'More agents',
    note: 'goose, Amp and Junie read `~/.agents/skills` too. Kiro reads `~/.kiro/skills`, and only in the IDE.',
    personal: agents,
    project: '.agents/skills',
    steps: [
      copyTo(agents),
      scripts(agents),
      {
        text: 'Check it loaded: run `goose skills list` for goose, `amp skills list` for Amp, or `/skills` in Junie.',
      },
      {
        text: 'Kiro: copy the folder to `~/.kiro/skills/iso` instead, then find it under Agent Steering & Skills in the Kiro panel, or type `/` in chat.',
        code: 'mkdir -p ~/.kiro/skills\ncp -R isokit/skill ~/.kiro/skills/iso',
      },
      project('.agents/skills'),
    ],
    sources: [
      { title: 'goose skills', url: 'https://goose-docs.ai/docs/guides/context-engineering/using-skills' },
      { title: 'Amp skills', url: 'https://ampcode.com/docs/customize/skills' },
      { title: 'Junie skills', url: 'https://junie.jetbrains.com/docs/agent-skills.html' },
      { title: 'Kiro skills', url: 'https://kiro.dev/docs/skills/' },
    ],
  },
} satisfies Record<string, Tool>;

export const tools = Object.entries(defs).map(([id, tool]) => ({ id, ...tool }));
