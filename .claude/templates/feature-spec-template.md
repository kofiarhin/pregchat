/spec Admin Access Control Refactor

Audit the current codebase and write an implementation-ready spec for fixing admin-only access.

Problem:
The app does not appear to have a clearly structured admin-only account/access system. I want a clean setup where only true admin users can access the admin dashboard and admin-only APIs.

Requirements for the spec:

- inspect the real repo first
- use the existing `/spec` command rules and `.claude/templates/feature-spec-template.md`
- do not generate implementation code
- save the spec into `_plan/`

What the spec should cover:

- current admin/auth structure in the repo
- whether admin is based on `isAdmin`, `role`, or both
- whether backend admin enforcement is reliable
- whether frontend admin protection is centralized or scattered
- whether sidebar/nav visibility logic matches backend authorization
- any endpoints that are currently open but should probably be authenticated-only or admin-only

Desired end state:

- one clear source of truth for admin identity
- only authenticated admins can access the admin dashboard
- only authenticated admins can access admin APIs
- frontend route protection should be centralized instead of handled inside pages
- backend authorization should be the real enforcement layer
- admin visibility in the UI should follow the same rule as backend authorization
- auth and authorization should be clearly separated
- the structure should be maintainable for future admin pages and routes

In the spec, be concrete and repo-specific.
Do not invent files or patterns that do not exist.
If the repo has mixed patterns, call that out clearly.
In File Impact, separate:

- Files Confirmed To Exist
- Files To Create
- Files To Update

Also include:

- risks around existing users/data shape
- risks around mixed `isAdmin` and `role`
- token vs DB-backed authorization concerns
- test requirements for admin and non-admin flows
- migration notes if the repo currently mixes admin patterns
