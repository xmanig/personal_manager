---
name: fetch-issue
description: Use when the user says "fetch issue", "work on issue", "start issue", "implement issue", or "implement ticket" followed by a number. Fetches a GitHub issue from xmanig/personal_manager and delegates implementation to a sub-agent.
---

# Fetch Issue

Fetches a GitHub issue and hands it off to the `issue-worker` sub-agent for implementation.

## Workflow

1. **Parse issue number** from user input (e.g. "fetch issue 7", "work on ticket T2.1" → extract the number)
2. **Fetch issue details** by running:
   ```
   gh issue view <NUMBER> --repo xmanig/personal_manager
   ```
3. **Extract from the issue:**
   - Title
   - Full body (description + acceptance criteria)
   - Labels
4. **Check if the `issue-worker` agent exists** — if not, inform the user and offer to create it from `.opencode/agent/issue-worker.md`
5. **Spawn the `issue-worker` sub-agent** with the full issue context in the prompt
6. **Return** the sub-agent's result to the user

## Sub-agent prompt template

When spawning the issue-worker, provide it with:

```
You are implementing GitHub issue #<NUMBER>: "<TITLE>"

## Issue Description
<FULL ISSUE BODY>

## Acceptance Criteria
<FROM ISSUE BODY OR TICKETS.md>

## Instructions
1. Read ARCHITECTURE.md for project context and design decisions
2. Read TICKETS.md for the full ticket with acceptance criteria
3. Explore relevant existing code in the repo
4. Implement the changes needed
5. Run lint/typecheck if available
6. Report: files changed, what was done, any blockers
```

## Notes

- The `issue-worker` agent must be defined in `.opencode/agent/issue-worker.md`
- Always work in the `/home/mgl/personal_manager` directory
- If the issue is blocked by a prerequisite ticket, check if that ticket's work exists first
- Commit changes with a message referencing the issue number (e.g. "feat: implement notes CRUD API (#7)")
