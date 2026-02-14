# Claude Code Plugin

A Claude Code plugin for automating GitHub workflows: code reviews, PR creation, team analytics, release management, and multi-model second opinions via Gemini.

## Installation

**1. Add the marketplace:**
```
/plugin marketplace add kwiggen/claude-code-plugin
```

**2. Install the plugin:**
```
/plugin install kw-plugin@claude-code-plugin
```

**3. (Optional) Enable auto-updates:**

Run `/plugin`, go to Marketplaces tab, enable auto-update for `claude-code-plugin`

### Updating

```
/plugin update kw-plugin@claude-code-plugin
```

### Requirements
- Claude Code v2.0.12 or higher
- GitHub CLI (`gh`) authenticated
- Git repository with GitHub remote
- (Optional) [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) for dual-review and second-opinion features

## Commands

### Code Review & PRs

| Command | Description |
|---------|-------------|
| `/review-code` | Run structured code reviews on uncommitted changes, commits, or GitHub PRs |
| `/create-pr [base]` | Create pull requests with AI-generated descriptions |

### Gemini Integration

| Command | Description |
|---------|-------------|
| `/gemini-review` | Dual code review from both Claude and Gemini with synthesis |
| `/ask-gemini` | Get Gemini's independent opinion on any file, topic, or question |

> **Requires:** [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) installed and authenticated. Install with `npm install -g @google/gemini-cli` or see the Gemini CLI repo for other methods. If the Gemini CLI is not available, these commands gracefully fall back to Claude-only behavior.

### Team Analytics

| Command | Description |
|---------|-------------|
| `/team-stats` | Team activity overview (PRs, reviews, contributors) |
| `/team-stats leaderboard` | Top contributors by PRs merged |
| `/team-stats merge-time` | Time-to-merge analysis |
| `/team-stats reviews` | Review participation report |
| `/team-stats size` | PR size analysis with bottleneck detection |
| `/team-stats first-review` | Time to first review per developer |
| `/team-stats balance` | Reviews given vs received ratio |
| `/team-stats reverts` | Track reverts and hotfixes |
| `/team-stats depth` | Detect rubber stamp reviews |
| `/team-stats cycles` | Rounds of feedback before merge |
| `/team-stats all` | Run all reports |

All team-stats commands accept an optional day range: `/team-stats leaderboard 14`

### Release Management

| Command | Description |
|---------|-------------|
| `/release-preview` | What's shipping (run Sunday after release train merges) |
| `/release-retro` | What happened (run Tuesday after prod stabilizes) |

**Release Preview** shows:
- All PRs in the release with size breakdown
- Risk flags (large PRs, quick approvals)
- Hotfixes needing backmerge
- AI-generated release notes

**Release Retro** shows:
- Release timeline and outcome
- Hotfix breakdown (staging vs release)
- 4-week trend analysis
- Action items for pending backmerges

### Planning & Validation

| Command | Description |
|---------|-------------|
| `/create-feature` | Guide feature definition through discussion, generate a 1-pager |
| `/create-issue` | Create a GitHub issue with project fields |
| `/validate` | Validate plans, proposals, or architecture with parallel analysis |

## Magic Keywords

Type these phrases naturally instead of using slash commands:

| Phrase | Action |
|--------|--------|
| "review", "code review", "cr" | Triggers `/review-code` |
| "gemini review", "dual review" | Triggers `/gemini-review` |
| "ask gemini", "gemini opinion" | Triggers `/ask-gemini` |
| "create pr", "open pr" | Triggers `/create-pr` |
| "team stats", "who merged" | Triggers `/team-stats` |
| "use opus" / "use sonnet" / "use haiku" | Sets model preference for subagents |
| "thorough", "deep review" | Enables thorough analysis mode |
| "ship it", "lgtm" | Enables fast-execution mode |

## Skills

| Skill | Used By |
|-------|---------|
| `code-reviewer` | `/review-code` |
| `pr-writer` | `/create-pr` |
| `github-insights` | `/team-stats` |
| `release-reports` | `/release-preview`, `/release-retro` |
| `feature-writer` | `/create-feature` |
| `issue-creator` | `/create-issue` |
| `gemini-reviewer` | `/gemini-review` |
| `gemini-advisor` | `/ask-gemini` |
| `assumption-challenger` | `/validate` |
| `antipattern-detector` | `/validate` |
| `validator` | `/validate` |

## Requirements

- [GitHub CLI](https://cli.github.com/) (`gh`) authenticated
- Git repository with GitHub remote

### Optional: Gemini CLI

The `/gemini-review` and `/ask-gemini` commands require the [Google Gemini CLI](https://github.com/google-gemini/gemini-cli):

```bash
npm install -g @google/gemini-cli
```

After installation, authenticate:

```bash
gemini
```

The CLI will walk you through authentication on first run. Once set up, verify with:

```bash
gemini --version
```

You can override the binary path via the `GEMINI_CLI_PATH` environment variable if it's not on your PATH.

If the Gemini CLI is not installed, the dual-review and advisor commands will gracefully fall back to Claude-only behavior.

## Structure

```
.claude-plugin/plugin.json   # Plugin metadata
commands/                    # Slash command definitions
skills/                      # Skill implementations (SKILL.md files)
src/github/                  # GitHub CLI wrapper (gh integration)
src/gemini/                  # Gemini CLI wrapper
src/insights/                # Team analytics engine
src/releases/                # Release report engine
src/features/                # Magic keywords, hooks
src/config/                  # Config loading & merging
src/state/                   # File-based state management
src/hud/                     # Statusline / HUD rendering
keywords.json                # Magic keyword definitions
```

## License

MIT
