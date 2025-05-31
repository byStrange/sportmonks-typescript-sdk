# Contributing to SportMonks TypeScript SDK

First off, thank you for considering contributing to the SportMonks TypeScript SDK! It's people like you that make this SDK a great tool for the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and considerate in all interactions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Submit a pull request

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Code samples (if applicable)
- Your environment (Node version, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear and descriptive title
- A detailed description of the proposed enhancement
- Use cases for the enhancement
- Any potential drawbacks or considerations

### Pull Requests

- Fill in the required template
- Follow the style guidelines
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass

## Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Add your SportMonks API key for integration tests
   ```

3. **Run tests:**

   ```bash
   npm test                 # Run all tests
   npm run test:unit       # Run unit tests only
   npm run test:integration # Run integration tests (requires API key)
   ```

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Run linting:**
   ```bash
   npm run lint
   ```

## Style Guidelines

### TypeScript Style Guide

- Use TypeScript strict mode
- Prefer interfaces over type aliases for object types
- Use enums for constants
- Document all public APIs with JSDoc comments
- Use meaningful variable and function names
- Keep functions small and focused

### Code Formatting

We use ESLint for code linting. Run `npm run lint` before submitting PRs.

Key conventions:

- 2 spaces for indentation
- Single quotes for strings
- No semicolons (except where required)
- Trailing commas in multi-line objects and arrays

### File Organization

```
src/
├── resources/      # Resource implementations (leagues, teams, etc.)
├── types/          # TypeScript type definitions and SportMonks syntax
├── core/           # Core functionality (base classes, query builder, errors)
├── utils/          # Utility functions (validators, polling, date helpers)
├── client.ts       # Main client class
└── index.ts        # Public exports
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add support for seasons endpoint
fix: correct date validation in fixtures resource
docs: update README with new examples
test: add unit tests for players resource
```

## Testing Guidelines

### Writing Tests

- Write unit tests for all new functionality
- Use descriptive test names that explain what is being tested
- Mock external dependencies (API calls) in unit tests
- Group related tests using `describe` blocks
- Use `beforeEach` and `afterEach` for setup and cleanup

### Test Structure

```typescript
describe('ResourceName', () => {
  describe('methodName', () => {
    test('should do something when condition is met', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- resources/teams.test.ts
```

## Pull Request Process

1. **Before submitting:**

   - Ensure all tests pass
   - Run linting and fix any issues
   - Update documentation if needed
   - Add tests for new functionality
   - Update CHANGELOG.md with your changes

2. **PR Guidelines:**

   - Use a clear and descriptive title
   - Reference any related issues
   - Provide a detailed description of changes
   - Include screenshots for UI changes (if applicable)
   - Request review from maintainers

3. **Review Process:**

   - Address review feedback promptly
   - Be open to suggestions and constructive criticism
   - Update your PR based on feedback
   - Ensure CI checks pass

4. **After Merge:**
   - Delete your feature branch
   - Update your local main branch
   - Celebrate your contribution! 🎉

## Adding New Resources

When adding a new SportMonks API resource:

1. Create the resource file in `src/resources/`
2. Define TypeScript interfaces in `src/types/entities.ts`
3. Add the resource to the client in `src/client.ts`
4. Export from `src/index.ts`
5. Write comprehensive tests
6. Update README with usage examples
7. Add to CHANGELOG.md

Example structure:

```typescript
// src/resources/newresource.ts
import { BaseResource } from '../core/base-resource';
import { QueryBuilder } from '../core/query-builder';

export class NewResource extends BaseResource {
  all(): QueryBuilder<PaginatedResponse<NewEntity>> {
    return new QueryBuilder(this, '');
  }

  byId(id: string | number): QueryBuilder<SingleResponse<NewEntity>> {
    return new QueryBuilder(this, `/${id}`);
  }
}
```

## Questions?

If you have questions about contributing, feel free to:

- Open an issue for discussion
- Check existing issues and pull requests
- Review the codebase for examples

Thank you for contributing!
