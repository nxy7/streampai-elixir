---
name: commit
description: Generate professional git commit message based on changes
allowed-tools: Bash, Grep, Read, Glob, LS, Task
argument-hint: "[optional context]"
---

Generate a professional git commit message analyzing all changes in the working directory or subdirectory

**Usage**: `/commit` or `/commit [optional context]`

**Arguments**: Optional additional context about the changes

## Context
- Git status: !git status --porcelain
- Recent commits for style reference: !git log --oneline -5
- Current branch: !git branch --show-current

## Your task

Analyze the changes and create a git commit message following these guidelines:

1. **Examine all changes** by running:
   - `git diff --staged` for staged changes
   - `git diff` for unstaged changes
   - Review our conversation history to understand the intent behind changes

2. **Create a commit message** with this format:
   ```
   <type>: <concise descriptive title>

   - <specific change 1>
   - <specific change 2>
   - <specific change 3>
   ```

3. **Commit type prefixes**:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `refactor:` for code restructuring
   - `style:` for formatting changes
   - `test:` for test additions/changes
   - `docs:` for documentation updates
   - `chore:` for maintenance tasks

4. **Title guidelines**:
   - Maximum 60 characters total
   - Imperative mood ("Add feature" not "Added feature")
   - No period at the end

5. **Change list guidelines**:
   - Simple flat list of bullet points
   - Each item describes a specific change
   - Focus on WHAT changed
   - No section headers or groupings
   - No sub-bullets
   - No fluff or filler text

6. **Do NOT**:
   - Mention AI assistance, Claude, or any tooling
   - Include co-author information
   - Add section headers like "Frontend:", "Backend:", etc.
   - Use vague descriptions like "various changes" or "updates"
   - Mention count of changed files or lines of code

## Example Output

```
feat: Add accounting access for limited/restricted users

- Show Accounting menu for users with fee access or in multi-user orgs
- Hide Assignee column for users who only see their own data
- Hide Qty./Perc. and Rate columns based on fee access permission
- Add key prop to Datagrids to fix column mismatch on permission load
- Add changelog entry for team commission access
```

```
fix: Add missing residential fields to property enrichment

- Add residential_ownership_type_id, residential_style_id to valid fields
- Add residential bedroom/bathroom counts and gross living area
- Include batch_data raw API response in property enrichment
```

$ARGUMENTS

Analyze the actual changes now and generate an appropriate commit message.
