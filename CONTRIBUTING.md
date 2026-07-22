# Contributing

## How to Contribute

### 1. Pick a Ticket

All work is tracked in GitHub Issues. Choose an issue that is:
- Assigned to you, OR
- Unassigned and in the current sprint

If you want to work on something not tracked, create an issue first.

### 2. Create a Branch

```
git checkout develop
git pull origin develop
git checkout -b feature/PROJ-123-short-description
```

Branch naming:
- `feature/PROJ-123-description` — new features
- `bugfix/PROJ-123-description` — non-critical fixes
- `hotfix/PROJ-123-description` — critical production fixes
- `chore/PROJ-123-description` — tooling, dependencies, CI
- `docs/PROJ-123-description` — documentation

### 3. Make Changes

- Follow [CODING STANDARDS](docs/coding-standards.md)
- Run linter before committing: `npm run lint`
- Write tests for your changes
- Update documentation if needed

### 4. Commit

Use [Conventional Commits](docs/git-strategy.md#commit-message-format):

```
feat(api): add session entry endpoint

Closes PROJ-123
```

### 5. Push and Open a PR

```
git push origin feature/PROJ-123-short-description
```

Open a Pull Request to `develop` with:
- Clear description of what and why
- Link to the issue
- Completed Definition of Done checklist (see below)
- Screenshots for UI changes

### 6. Code Review

- At least 1 approval required
- Address all review comments
- All CI checks must pass
- Squash merge when approved

---

## PR Checklist

Every pull request must include:

```markdown
### Description
[What does this change? Why?]

### Related Issues
Closes PROJ-123

### Checklist
- [ ] Code follows coding standards
- [ ] Tests written and passing
- [ ] Authorization enforced
- [ ] Input validation server-side
- [ ] Race conditions handled
- [ ] No secrets committed
- [ ] Docs updated if needed
```

---

## Development Setup

### Prerequisites

- Node.js 20 LTS
- npm 10+
- Git

### Setup

```bash
# Clone
git clone <repo-url>
cd attendance

# Backend
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Code Review Expectations

### Reviewers check for:

1. **Correctness** — Does the code do what it says?
2. **Security** — Are auth, validation, and ownership enforced?
3. **Testing** — Are tests meaningful? Do they cover edge cases?
4. **Naming** — Are variables, functions, and types descriptive?
5. **Duplication** — Is existing code reused?
6. **Patterns** — Does it follow project conventions?

### Authors should:

- Keep PRs small (< 400 lines)
- Respond to comments promptly
- Explain design decisions in the PR description
- Self-review before requesting review

---

## Getting Help

- Ask in the project channel
- Tag the tech lead for architecture questions
- Open a discussion for design decisions before implementing
