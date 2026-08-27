<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UI Component Guidelines: Form Dropdowns

- **Searchable Selects**: Whenever rendering a dropdown selector with multiple choices (such as industries/categories, countries, wilayas/cities, partner organizations, tiers, or custom form question dropdowns), ALWAYS use `<SearchableSelect>` from `components/SearchableSelect.js` instead of native `<select>` elements.
- **Search Behavior**: Dropdowns with more than 4 items must automatically provide a sticky search bar with real-time filtering, keyboard navigation support (Enter, Space, Up/Down arrows), clear selection button (`X`), and focus ring styling.

# Version Control & Git Operations

- **No Unsolicited Remote Pushes**: NEVER execute `git push` or modify remote repositories automatically.
- **Explicit User Request Only**: Only push to GitHub / remote repositories when the user explicitly provides a command/instruction to push (e.g., "push to github", "git push").
- **Local Commits Permitted**: Creating local commits or staging changes is acceptable, but remote synchronization must strictly await direct user consent.

