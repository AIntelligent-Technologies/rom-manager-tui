# CI/CD Setup Guide

This document describes the complete continuous integration and continuous deployment (CI/CD) setup for ROM Manager TUI.

## Overview

The project uses GitHub Actions for automated testing, linting, type-checking, and releases. Dependabot is configured to automatically update dependencies.

## Workflows

### 1. Test Workflow (`.github/workflows/test.yml`)

Automatically runs on every push and pull request to `main` and `develop` branches.

**What it does:**
- Installs dependencies using Bun
- Runs all unit tests
- Generates coverage reports
- Uploads coverage to Codecov

**Matrix Testing:**
- Ubuntu (latest)
- macOS (latest)

**Triggers:**
- Push to `main` or `develop`
- Pull requests against `main` or `develop`

**Example Output:**
```
✓ Test on ubuntu-latest (passed)
✓ Test on macos-latest (passed)
```

### 2. Lint & Format Workflow (`.github/workflows/lint.yml`)

Runs code quality checks on every push and pull request.

**Jobs:**

#### ESLint
- Enforces code style and best practices
- Checks for React-specific issues
- Validates TypeScript strict mode
- Fails if any violations found

#### TypeScript Type Check
- Validates TypeScript compilation
- Ensures type safety across the project
- Fails on type errors

#### Prettier Format Check
- Verifies code formatting compliance
- Ensures consistent spacing and indentation
- Does not modify code in CI (use `bun run lint:fix` locally)

**Triggers:**
- Push to `main` or `develop`
- Pull requests against `main` or `develop`

### 3. Release Workflow (`.github/workflows/release.yml`)

Automatically builds and publishes releases when a version tag is pushed.

**What it does:**
- Runs full test suite
- Runs linter and type checks
- Builds the project
- Creates GitHub release with artifacts
- Publishes to npm (for non-prerelease versions)

**Tag Format:**
- Stable: `v1.0.0`, `v1.2.3`
- Beta: `v1.0.0-beta.1`, `v1.0.0-beta.2`
- RC: `v1.0.0-rc.1`
- Alpha: `v1.0.0-alpha.1`

**Publish Behavior:**
- Publishes to npm for stable releases only
- Pre-releases marked as draft or prerelease on GitHub

**Triggers:**
- Push of a tag matching `v*`

**Example:**
```bash
git tag v1.0.0
git push origin v1.0.0
# Automatically builds and publishes
```

## Quality Tools Configuration

### ESLint (`.eslintrc.js`)

Enforces code quality standards:

**Extends:**
- `eslint:recommended` — Basic rules
- `@typescript-eslint/strict-type-checked` — Strict TypeScript rules
- `@typescript-eslint/stylistic-type-checked` — Style rules
- `plugin:react/recommended` — React best practices
- `plugin:react-hooks/recommended` — React Hooks rules
- `prettier` — Disables formatting rules (Prettier handles formatting)

**Key Rules:**
- Strict type checking (`@typescript-eslint/no-explicit-any: error`)
- No unused variables (with `_` prefix exception for intentional ignores)
- React in JSX scope disabled (not needed in React 17+)
- Console logging restricted to `warn` and `error`

**Run Locally:**
```bash
bun run lint          # Check for violations
bun run lint:fix      # Auto-fix violations
```

### Prettier (`.prettierrc`)

Automatic code formatting configuration:

**Settings:**
- **Semi-colons:** Enabled
- **Single Quotes:** Enabled (not double quotes)
- **Indentation:** 2 spaces (not tabs)
- **Trailing Commas:** All (arrays, objects, function parameters)
- **Print Width:** 100 characters
- **Arrow Parens:** Always (even for single parameters)

**Run Locally:**
```bash
bun run format        # Format all files
bun run format:check  # Check formatting without changes
```

### TypeScript (`tsconfig.json`)

Strict TypeScript configuration:

**Compiler Options:**
- **Target:** ES2022 (modern JavaScript)
- **Strict:** Enabled (strict null checks, strict function types, etc.)
- **Module:** ESNext (modern module syntax)
- **JSX:** react-jsx (automatic JSX transformation)
- **Declaration:** Enabled (generate .d.ts files)
- **Source Maps:** Enabled (debugging support)

**Module Resolution:**
- **moduleResolution:** bundler (Bun-compatible)
- **Path Aliases:** `@/*` → `src/*`

**Excluded:**
- `node_modules/`
- `dist/`, `build/`
- `tests/`

**Run Locally:**
```bash
bun run type-check    # Check for type errors
```

## Local Development Workflow

### Setup

```bash
# Install dependencies
bun install

# Install git hooks (optional)
# bun run prepare  # if using husky
```

### Before Committing

```bash
# Run all checks (what CI runs)
bun run ci

# Or run individually:
bun run lint          # Check linting
bun run lint:fix      # Fix linting issues
bun run format        # Format code
bun run type-check    # Check types
bun run test          # Run tests
```

### Code Quality Standards

1. **Linting:** All ESLint violations must be fixed
2. **Formatting:** Code must pass Prettier format check
3. **Types:** TypeScript compilation must succeed with no errors
4. **Tests:** All tests must pass with no skipped tests
5. **Coverage:** Aim for >80% code coverage

## Dependency Management

### Dependabot Configuration (`.github/dependabot.yml`)

Automatically creates pull requests for dependency updates:

**npm Dependencies:**
- **Schedule:** Weekly (Mondays at 3 AM UTC)
- **Limit:** Maximum 5 open PRs
- **Reviewers:** AIntelligentTech
- **Assignees:** AIntelligentTech
- **Ignored:** bun (not managed by npm)

**GitHub Actions:**
- **Schedule:** Monthly (first Monday at 3 AM UTC)
- **Limit:** Unlimited
- **Reviewers:** AIntelligentTech

**Workflow:**
1. Dependabot creates a PR with updated dependencies
2. CI automatically runs tests against the updates
3. If tests pass, PR is ready to merge
4. If tests fail, PR includes failure details

## Troubleshooting

### Tests Failing in CI but Passing Locally

**Causes:**
- Different Node/Bun versions
- Cache inconsistencies
- OS-specific issues

**Solutions:**
```bash
# Clear and reinstall
rm -rf node_modules bun.lock
bun install

# Run tests
bun test
```

### Linting Errors in CI

**Common Issues:**
- Unused variables
- Missing type annotations
- Formatting differences

**Solutions:**
```bash
# Auto-fix most issues
bun run lint:fix

# Format code
bun run format

# Check remaining issues
bun run lint
```

### Type Checking Failures

**Common Issues:**
- Missing type definitions
- Incorrect type assertions
- Incompatible types

**Solutions:**
```bash
# Check detailed error messages
bun run type-check

# Install missing types
bun add -d @types/package-name

# Fix type errors
# Edit code to resolve type issues
```

### Release Workflow Failures

**Check:**
1. All tests pass locally: `bun run ci`
2. Tag format is correct: `v1.0.0`
3. npm token is set in GitHub secrets
4. package.json version matches tag

**Manual Release (if needed):**
```bash
# Push the tag to trigger workflow
git tag v1.0.0
git push origin v1.0.0

# Check workflow status
# https://github.com/AIntelligent/rom-manager-tui/actions
```

## GitHub Secrets Configuration

For the release workflow to function, configure these secrets in GitHub:

**Required:**
- `NPM_TOKEN` — npm authentication token (for npm publish)

**Optional:**
- `CODECOV_TOKEN` — Codecov authentication (for coverage)

**How to Add:**
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value
4. Save

## Performance Optimization

### CI Speed

The workflows are optimized for speed:

1. **Parallel Jobs:** Lint, type-check, and format run in parallel
2. **Matrix Testing:** Tests run on multiple OS in parallel
3. **Cached Dependencies:** Bun caches modules between runs
4. **Early Failures:** Fast checks (lint) run before slow tests

**Expected Times:**
- Lint job: ~30 seconds
- Type-check job: ~20 seconds
- Format job: ~20 seconds
- Test job (ubuntu): ~60 seconds
- Test job (macos): ~90 seconds
- Total parallel time: ~2 minutes

### Local Speed

To speed up local development:

```bash
# Run only fast checks
bun run lint && bun run type-check && bun run format:check

# Skip tests if making formatting changes
bun run lint:fix && bun run format

# Use git hooks to lint before commit (optional)
# Setup instructions in git-hooks directory
```

## Integration with IDEs

### VS Code

1. **Install Extensions:**
   - ESLint (dbaeumer.vscode-eslint)
   - Prettier - Code formatter (esbenp.prettier-vscode)

2. **Settings (`.vscode/settings.json`):**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "eslint.validate": ["typescript", "typescriptreact"],
  "eslint.autoFixOnSave": true
}
```

### WebStorm / IntelliJ

1. **Settings → Languages & Frameworks → TypeScript → ESLint:**
   - Enable ESLint
   - Run ESLint on save

2. **Settings → Languages & Frameworks → JavaScript → Prettier:**
   - Enable Prettier
   - Run on save

## Best Practices

1. **Run `bun run ci` before pushing code**
   - Catches issues before CI
   - Saves time waiting for workflows

2. **Keep dependencies up-to-date**
   - Review Dependabot PRs regularly
   - Test updates before merging

3. **Use conventional commits**
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for test additions/changes
   - `chore:` for build/dependencies/etc.

4. **Write tests for new features**
   - Aim for >80% coverage
   - Test error cases, not just happy paths

5. **Keep PRs focused**
   - One feature per PR
   - Easier to review and test
   - Clearer git history

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Configuration](https://eslint.org/docs/rules)
- [Prettier Configuration](https://prettier.io/docs/en/options.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
- [Bun Package Manager](https://bun.sh)
