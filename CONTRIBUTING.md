# Contributing to Webex CDR Viewer

Thank you for your interest in contributing to the Webex CDR Viewer project! This document outlines our development process and guidelines for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Issue Tracking](#issue-tracking)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Release Process](#release-process)

## Code of Conduct

We expect all contributors to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please make sure to read and understand it.

## Development Workflow

We follow a standard GitHub flow:

1. **Fork** the repository (external contributors)
2. Create a **feature branch** from `main` with a descriptive name
   ```
   git checkout -b feature/your-feature-name
   ```
3. Implement your changes
4. Write or update tests as needed
5. Ensure all tests pass and linting standards are met
6. Commit your changes following our [commit message guidelines](#commit-message-guidelines)
7. Create a Pull Request

## Issue Tracking

All changes to the codebase must be associated with an issue. This helps track the purpose of changes and maintain a clear history.

### Creating Issues

- Use the issue templates to create a new issue
- Provide a clear title and description
- Add appropriate labels
- Assign to yourself if you plan to work on it

### Issue Labels

- `bug`: Something isn't working correctly
- `enhancement`: New feature or improvement
- `documentation`: Documentation changes
- `ci/cd`: CI/CD pipeline changes
- `question`: Further information is requested
- `priority-high/medium/low`: Indicate urgency
- `good-first-issue`: Good for newcomers

## Pull Request Process

1. Ensure your PR addresses an open issue (create one if needed)
2. Update documentation to reflect any changes
3. Add tests for new functionality
4. Make sure CI checks pass
5. Request a review from at least one maintainer
6. Include issue number(s) in the PR description using keywords like "Fixes #123" or "Resolves #456"

### PR Title Format

Use a descriptive title with a prefix indicating the type of change:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting/style changes
- `refactor:` for code refactoring
- `test:` for adding or modifying tests
- `ci:` for CI/CD changes
- `chore:` for routine tasks, dependency updates, etc.

Example: `feat: Add user filter to call history view`

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(cdr): implement date range filtering

Add date picker component to filter call records by date range.
The filter automatically updates the call list when dates change.

Resolves #42
```

## Coding Standards

- Use consistent indentation (2 spaces)
- Follow JavaScript/TypeScript best practices
- Comment complex code sections
- Use meaningful variable and function names
- Keep functions small and focused
- Use ES6+ features when appropriate

## Testing

- Write tests for all new functionality
- Ensure existing tests pass
- Run tests locally before submitting a PR:
  ```
  npm test
  ```

## Release Process

1. We use semantic versioning (MAJOR.MINOR.PATCH)
2. The CI/CD pipeline will automatically:
   - Run tests on all PRs to main
   - Build and tag releases when version is bumped in package.json
   - Create release notes based on merged PRs and fixed issues

Thank you for contributing to Webex CDR Viewer!