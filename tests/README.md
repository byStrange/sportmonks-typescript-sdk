# SportMonks SDK Tests

This directory contains all tests for the SportMonks TypeScript SDK.

## Structure

```
tests/
├── unit/                 # Unit tests with mocked dependencies
│   ├── leagues.test.ts   # Unit tests for LeaguesResource
│   ├── core/             # Core functionality tests
│   │   └── base-resource.test.ts
│   ├── utils/            # Utility function tests
│   │   ├── validators.test.ts
│   │   └── polling.test.ts
│   └── syntax-helpers.test.ts
├── integration/          # Integration tests with real API
│   └── leagues.integration.test.ts
├── helpers/              # Test utilities and mock data
│   └── mock-data.ts      # Mock data factories
└── setup.ts              # Jest setup file
```

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### With Coverage

```bash
npm run test:coverage
```

## Integration Tests

Integration tests require a real SportMonks API key. Set it as an environment variable:

```bash
export SPORTMONKS_TEST_API_KEY=your_api_key_here
npm run test:integration
```

Or create a `.env` file in the project root:

```
SPORTMONKS_TEST_API_KEY=your_api_key_here
```

If no API key is provided, integration tests will be skipped.

## Test Helpers

The `helpers/mock-data.ts` file provides factory functions for creating mock data:

- `createMockResponse()` - Creates a mock API response with proper structure
- `createMockLeague()` - Creates a mock League entity
- `createMockCountry()` - Creates a mock Country entity
- `createMockTeam()` - Creates a mock Team entity
- `createMockPlayer()` - Creates a mock Player entity
- `delay()` - Helper for adding delays between tests

## Writing New Tests

### Unit Tests

Unit tests should:

- Mock all external dependencies (axios, etc.)
- Test individual methods and edge cases
- Run quickly without network calls
- Use mock data from helpers

Example:

```typescript
test('should fetch league by ID', async () => {
  const mockLeague = createMockLeague();
  mockAxiosInstance.get.mockResolvedValueOnce({
    data: { data: mockLeague }
  });

  const response = await client.leagues.byId(271).get();

  expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/271', { params: {} });
  expect(response.data).toEqual(mockLeague);
});
```

### Integration Tests

Integration tests should:

- Use real API endpoints
- Include rate limit awareness (delays between tests)
- Handle API errors gracefully
- Skip if no API key is available

Example:

```typescript
test('should fetch a specific league by ID', async () => {
  const response = await client.leagues.byId(8).get();

  expect(response.data).toBeDefined();
  expect(response.data.id).toBe(8);
  expect(response.data.name).toBeTruthy();

  logRateLimit(response);
}, 10000); // 10 second timeout
```

## Rate Limits

SportMonks API has rate limits:

- 3000 requests per entity per hour
- Rate limit info is included in response body

Integration tests include:

- 200ms delay between tests
- Rate limit logging
- Tracking of remaining requests

## Test Coverage

Current coverage: **97.62%** (330+ tests)

Run coverage report:

```bash
npm run test:coverage
```

Coverage includes:

- **97.62% Statement coverage**
- **90.33% Branch coverage**
- **97.08% Function coverage**
- All source files in `src/`
- Comprehensive utility and core functionality testing
- Excludes test files and index files
- Generates HTML report in `coverage/`

### Test Types

- **Unit tests**: 250+ tests covering all resources, utilities, and core functionality
- **Integration tests**: 80+ tests with real API calls
- **Syntax tests**: Comprehensive tests for SportMonks syntax features
