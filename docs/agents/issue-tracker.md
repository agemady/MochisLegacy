# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues on `agemady/MochisLegacy`. Use the `gh` CLI for all operations.

Canonical plan and domain decisions still live in the sibling repo `agemady/mochis-legacy` (`mochis-legacy-plan.md`, `data-model.md`, `schema.sql`). Do not fork those decisions here.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels`.
- **Comment**: `gh issue comment <number> --body "..."`
- **Labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`.

## Wayfinding operations

The map is the issue labelled `wayfinder:map`. Tickets are child issues of the map, each labelled one of `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task`.

- **Create the map**: `gh issue create --label wayfinder:map --title "..." --body "..."`.
- **Create a ticket**: `gh issue create --label wayfinder:<type> --title "..." --body "..."` then attach it as a sub-issue:

  ```
  gh api -X POST repos/agemady/MochisLegacy/issues/<map>/sub_issues \
    -f sub_issue_id=<ticket_node_id>
  ```

  `sub_issue_id` is the issue's numeric `id`, not its number. Read it from `gh issue view <n> --json id`.

- **Claim a ticket**: `gh issue edit <number> --add-assignee @me` before any work. An open unassigned ticket is unclaimed.
- **Block**: native GitHub dependencies.

  ```
  gh api -X POST repos/agemady/MochisLegacy/issues/<blocked>/dependencies/blocked_by \
    -f issue_id=<blocker_id>
  ```

- **Frontier**: open, unblocked, unclaimed children of the map.
- **Resolve**: post a resolution comment, close the ticket, append one gist line to the map's **Decisions so far**.
- **Refer by name**: always wrap the link in the ticket title, never a bare `#42`.

Local `gh` 2.86 may lack `--parent` / `--blocked-by` flags; use the REST API above.

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `agemady/MochisLegacy`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
