# SportMonks TypeScript SDK

A comprehensive, production-ready TypeScript SDK for the SportMonks Football API v3. Built with modern TypeScript, featuring complete type safety, intuitive method chaining, automatic retries, real-time polling, and extensive test coverage.

## Features

- 🚀 **Full TypeScript Support** - Complete type definitions for all 50+ entities and responses
- 🔗 **Intuitive Method Chaining** - Fluent API design for building complex queries naturally
- 📦 **Comprehensive Coverage** - 10 resources with 56 endpoints covering all major football data
- 🔄 **Smart Retry Logic** - Automatic retry with exponential backoff and rate limit awareness
- 📊 **Real-time Updates** - Built-in polling utilities for livescores and transfer monitoring
- ✅ **Input Validation** - Automatic validation of dates, IDs, and search queries with helpful errors
- 🎯 **Type-safe Includes** - Full TypeScript support for relationship includes
- 📈 **Performance Optimized** - Efficient pagination, response caching, and minimal dependencies
- 🧪 **Battle-tested** - 330+ tests with 97.7% coverage and real API validation
- 📝 **Extensive Documentation** - Comprehensive JSDoc comments, examples, and guides

## Quick Example

```typescript
import { SportMonksClient } from '@withqwerty/sportmonks-typescript-sdk';

const client = new SportMonksClient('YOUR_API_KEY');

// Get fixtures for today with team and venue information
const fixtures = await client.fixtures
  .byDate('2024-01-15')
  .include(['participants', 'scores', 'venue'])
  .get();

// Search for teams with pagination
const teams = await client.teams.search('Manchester').page(1).perPage(10).get();
```

## Why Use This SDK?

### Type Safety

Every API response is fully typed, giving you IntelliSense support and compile-time error checking.

### Intuitive API

The method chaining approach makes building complex queries feel natural and readable.

### Production Ready

With automatic retries, rate limit handling, and comprehensive error messages, this SDK is built for production use.

### Well Tested

Over 330 tests ensure reliability, with both unit tests and integration tests against the real API.

## Next Steps

- [Get started with installation](./getting-started/installation.md)
- [Learn about core concepts](./core-concepts/client-setup.md)
- [Explore the API resources](./resources/leagues.md)
- [Try the interactive REPL](./tools/repl.md)
