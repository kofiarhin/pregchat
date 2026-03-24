---
description: Generate an implementation-ready feature spec and save it to _plan
argument-hint: [feature request]
---

You are creating an implementation-ready feature spec for this project.

The user may provide:

- a feature name
- a rough idea
- a sentence describing the desired outcome
- a problem they want solved
- a workflow they want supported

Your job is to:

1. understand the request
2. derive a clean feature name if needed
3. review project context
4. use `.claude/templates/feature-spec-template.md` as the required output structure
5. generate the feature spec
6. save it to `_plan/<kebab-case-feature-name>.md`

## Read first

Before writing, review:

- `pregchat-spec.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/templates/feature-spec-template.md`
- relevant files in `client/` and `server/`

If the repo differs from the master spec, prefer the real repo structure.

## Naming rules

Choose a feature name that:

- reflects the main user-facing capability
- is concise
- is implementation-friendly
- is usually 2 to 5 words

If the user input is already a clean feature name, use it.
If not, infer a strong feature name from the intended outcome.

Convert the final feature name to kebab-case and save to:

`_plan/<feature-name>.md`

If `_plan/` does not exist, create it.

If a matching feature file already exists and the request clearly refers to the same feature, update it.
Otherwise, create a more specific filename.

## Generation rules

- Follow `.claude/templates/feature-spec-template.md`
- Fill every section with concrete implementation details
- Match the current repo architecture
- Prefer decisions over vague options
- Keep it practical and build-ready
- Follow the actual folder structure, styling system, data-fetching patterns, and feature organization already established in the repository
- Only fall back to general defaults when the repo does not already establish a pattern
- Respect the conventions documented in `CLAUDE.md`
- In `File Impact`, always separate:
  - `Files Confirmed To Exist`
  - `Files To Create`
  - `Files To Update`

## Accuracy rules

- Do not invent existing files, hooks, routes, models, components, services, utilities, fallback logic, patterns, or stylesheets
- Only reference an existing file, hook, route, model, component, service, or pattern if it was explicitly found during repo review
- If something was not explicitly found, describe the requirement generically or place it under `Files To Create`
- Never place an unverified file under `Files Confirmed To Exist` or `Files To Update`
- Match the repo's real structure exactly
- Do not imply an existing feature pattern, query key shape, storage pattern, or architecture convention unless it was explicitly found in the repo
- Do not create new folder conventions unless the plan explicitly requires them or the repo already uses them
- Follow the styling system explicitly confirmed in the repo
- If the repo uses SCSS, do not propose Tailwind
- If the repo uses Tailwind, do not propose SCSS
- If the styling system is not explicitly confirmed, describe styling generically instead of inventing a new styling setup

## Final response after saving

Return:

- Feature Name
- Saved Path
- Short Summary
- Immediate Next Build Step
