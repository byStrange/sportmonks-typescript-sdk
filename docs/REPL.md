# SportMonks SDK REPL (Interactive Console)

The SportMonks TypeScript SDK includes an interactive REPL (Read-Eval-Print Loop) for testing and exploring the API. The REPL tools are located in the `tools/` directory.

## Features

- 🚀 Interactive console with full SDK access
- 🔍 Autocomplete support for resources and methods
- 📝 Command history (persisted between sessions)
- 🎨 Syntax highlighting and colored output
- 📚 Built-in examples and documentation
- 🛠️ Helper functions for data exploration

## Getting Started

### 1. Set up your API key

Create a `.env` file in the project root:

```bash
SPORTMONKS_API_KEY=your_api_key_here
```

Or set it as an environment variable:

```bash
export SPORTMONKS_API_KEY=your_api_key_here
```

### 2. Start the REPL

```bash
npm run repl
```

## Basic Usage

### Simple Queries

```javascript
// Get all leagues (limited to 5)
await client.leagues.all().limit(5).get();

// Get a specific team with includes
await client.teams.byId(1).include(['country', 'venue']).get();

// Search for players
await client.players.search('Ronaldo').limit(10).get();
```

### Using Includes

```javascript
// Get fixtures with team information
await client.fixtures.byDate('2024-01-15').include(['localteam', 'visitorteam']).get();

// Get league with nested includes
await client.leagues.byId(8).include(['country', 'seasons.stages']).get();
```

### Complex Queries

```javascript
// Filter national teams in a season
await client.teams.bySeason(19735).include(['country']).filter('national_team', 'true').get();

// Get head-to-head with full match details
await client.fixtures.headToHead(1, 14).include(['events', 'lineups']).limit(5).get();

// Get transfers between dates
await client.transfers
  .between('2024-01-01', '2024-01-31')
  .include(['player', 'fromteam', 'toteam'])
  .get();
```

## Helper Functions

### `pp(response)` - Pretty Print

Pretty prints the entire response object with proper formatting:

```javascript
const response = await client.leagues.all().limit(3).get();
pp(response);
```

### `data(response)` - Extract Data

Prints only the data array from the response:

```javascript
const response = await client.teams.search('Manchester').get();
data(response);
```

### `examples()` - Show Examples

Displays example queries you can run:

```javascript
sportmonks > examples();
```

### `resources()` - List Resources

Shows all available resources and their methods:

```javascript
sportmonks > resources();
```

## Available Resources

- **leagues** - Football leagues and competitions
- **teams** - Football teams
- **players** - Player information
- **fixtures** - Matches and game data
- **seasons** - Season information
- **squads** - Team squads by season
- **standings** - League tables and standings
- **transfers** - Player transfers
- **venues** - Stadium information
- **coaches** - Coach/manager data
- **referees** - Referee information
- **livescores** - Live match data

## Tips and Tricks

### 1. Use Tab Completion

Press `Tab` to autocomplete resource names and methods:

```
sportmonks> client.lea[TAB]
sportmonks> client.leagues
```

### 2. Store Results in Variables

```javascript
const leagues = await client.leagues.all().limit(10).get();
const premierLeague = leagues.data.find(l => l.name.includes('Premier'));
```

### 3. Explore Response Structure

```javascript
const response = await client.teams.byId(1).get();
Object.keys(response); // See available fields
```

### 4. Use Async/Await

All API calls return promises, so use `await`:

```javascript
// Good
const data = await client.players.byId(580).get();

// Without await (returns Promise)
const promise = client.players.byId(580).get();
```

### 5. Chain Multiple Operations

```javascript
const teams = await client.teams
  .bySeason(19735)
  .include(['country', 'venue'])
  .filter('national_team', 'false')
  .page(1)
  .perPage(30)
  .get();
```

## Keyboard Shortcuts

- `Tab` - Autocomplete
- `↑/↓` - Navigate command history
- `Ctrl+C` - Cancel current input
- `Ctrl+D` or `.exit` - Exit REPL
- `Ctrl+L` - Clear screen

## Error Handling

The REPL will show detailed error messages:

```javascript
// API errors show full details
await client.teams.byId(999999).get();
// Error: Request failed with status code 404

// Validation errors
await client.fixtures.byDate('invalid-date').get();
// Error: Invalid date format: invalid-date. Expected YYYY-MM-DD
```

## Environment Variables

- `SPORTMONKS_API_KEY` - Your SportMonks API key
- `SPORTMONKS_TEST_API_KEY` - Alternative key for testing

## Notes

- The REPL maintains a history file (`.sportmonks_repl_history`) for command persistence
- All SDK features are available in the REPL
- The client is pre-initialized and available as `client`
- Use `require()` to load additional modules if needed
