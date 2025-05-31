# Type Helpers Guide

The SportMonks TypeScript SDK includes utility types and functions to make working with API responses even more type-safe.

## Type Guards

### `hasInclude()`

Check if an optional include is present and get proper type inference:

```typescript
import { hasInclude } from '@withqwerty/sportmonks-typescript-sdk';

const team = await client.teams.byId(1).include(['country', 'venue']).get();

if (hasInclude(team.data, 'country')) {
  // TypeScript now knows team.data.country is defined
  console.log(team.data.country.name); // ✅ No type errors
}
```

### `hasData()`

Type guard for responses with data:

```typescript
import { hasData } from '@withqwerty/sportmonks-typescript-sdk';

const response = await client.teams.byId(1).get();

if (hasData(response)) {
  // TypeScript knows response.data exists
  console.log(response.data.name);
}
```

### `isPaginatedResponse()` / `isSingleResponse()`

Distinguish between response types:

```typescript
import { isPaginatedResponse, isSingleResponse } from '@withqwerty/sportmonks-typescript-sdk';

const response = await client.teams.all().get();

if (isPaginatedResponse(response)) {
  // response.data is Team[]
  response.data.forEach(team => console.log(team.name));
} else if (isSingleResponse(response)) {
  // response.data is Team
  console.log(response.data.name);
}
```

## Type Helpers

### `ExtractData<T>`

Extract the data type from any response:

```typescript
import {
  ExtractData,
  SingleResponse,
  PaginatedResponse
} from '@withqwerty/sportmonks-typescript-sdk';

type TeamData = ExtractData<SingleResponse<Team>>; // Team
type TeamsData = ExtractData<PaginatedResponse<Team>>; // Team[]
```

### `WithRequired<T, K>`

Make optional properties required when you know they're included:

```typescript
import { WithRequired, Team } from '@withqwerty/sportmonks-typescript-sdk';

// Make country required on Team type
type TeamWithCountry = WithRequired<Team, 'country'>;

// Make multiple properties required
type TeamWithAll = WithRequired<Team, 'country' | 'venue' | 'coach'>;
```

### Pre-defined Include Types

Common include combinations are pre-defined for convenience:

```typescript
import {
  TeamWithCountry,
  TeamWithVenue,
  TeamWithAll,
  FixtureWithTeams,
  FixtureWithEvents,
  PlayerWithTeam
} from '@withqwerty/sportmonks-typescript-sdk';

// Use in your functions
function processTeamWithCountry(team: TeamWithCountry) {
  // country is guaranteed to exist
  console.log(`${team.name} from ${team.country.name}`);
}
```

## Utility Functions

### `getNestedInclude()`

Safely access nested include properties:

```typescript
import { getNestedInclude } from '@withqwerty/sportmonks-typescript-sdk';

const team = await client.teams.byId(1).include(['country']).get();

// Safe access - returns undefined if not present
const countryName = getNestedInclude(team.data, 'country', 'name');
const countryCode = getNestedInclude(team.data, 'country', 'code');
```

### Filter Helpers

Type-safe filter functions:

```typescript
import { isNationalTeam } from '@withqwerty/sportmonks-typescript-sdk';

const teams = await client.teams.all().get();
const nationalTeams = teams.data.filter(isNationalTeam);
```

### Sort Helpers

Type-safe sorting functions:

```typescript
import { sortByName, sortByCapacity } from '@withqwerty/sportmonks-typescript-sdk';

// Sort teams by name
const sortedTeams = teams.data.sort(sortByName);

// Sort venues by capacity (descending)
const sortedVenues = venues.data.sort(sortByCapacity);
```

### Response Transformers

Create typed transformers for responses:

```typescript
import { createTransformer, PaginatedResponse, Team } from '@withqwerty/sportmonks-typescript-sdk';

// Create a transformer that extracts team names
const toTeamNames = createTransformer<PaginatedResponse<Team>, string[]>(response =>
  response.data.map(team => team.name)
);

// Use it
const response = await client.teams.all().get();
const names = toTeamNames(response); // string[]
```

## Complete Example

Here's how to use multiple type helpers together:

```typescript
import {
  SportMonksClient,
  hasInclude,
  isPaginatedResponse,
  TeamWithCountry,
  sortByName
} from '@withqwerty/sportmonks-typescript-sdk';

const client = new SportMonksClient(API_KEY);

async function getTeamsByCountry(countryName: string) {
  const response = await client.teams.all().include(['country']).perPage(100).get();

  if (!isPaginatedResponse(response)) {
    throw new Error('Unexpected response type');
  }

  // Filter teams with type safety
  const teamsFromCountry = response.data.filter((team): team is TeamWithCountry => {
    return hasInclude(team, 'country') && team.country.name === countryName;
  });

  // Sort and return
  return teamsFromCountry.sort(sortByName);
}

// Usage
const englishTeams = await getTeamsByCountry('England');
englishTeams.forEach(team => {
  console.log(`${team.name} - ${team.country.name}`); // ✅ Type safe!
});
```

## Benefits

1. **Type Safety**: Eliminate runtime errors from accessing undefined includes
2. **Better IntelliSense**: Get proper autocomplete for included properties
3. **Cleaner Code**: Use type guards instead of manual checks
4. **Reusability**: Pre-defined types for common include patterns
