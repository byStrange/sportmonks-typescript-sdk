#!/usr/bin/env node

import repl from 'repl';
import path from 'path';
import { SportMonksClient } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ANSI color codes
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

// Check for API key
const apiKey = process.env.SPORTMONKS_TEST_API_KEY || process.env.SPORTMONKS_API_KEY;

if (!apiKey) {
  console.error(`${colors.red}Error: No API key found!${colors.reset}`);
  console.log(`
Please set your API key in one of these ways:
1. Create a .env file with SPORTMONKS_API_KEY=your_key_here
2. Export environment variable: export SPORTMONKS_API_KEY=your_key_here
3. Pass it when starting the REPL: SPORTMONKS_API_KEY=your_key_here npm run repl
  `);
  process.exit(1);
}

console.log(`${colors.cyan}🚀 SportMonks TypeScript SDK REPL${colors.reset}`);
console.log(`${colors.dim}API Key: ${apiKey.substring(0, 10)}...${colors.reset}`);
console.log('');

// Create client instance
const client = new SportMonksClient(apiKey);

// List of protected resource names
const protectedNames = [
  'leagues', 'teams', 'players', 'fixtures', 'seasons', 
  'squads', 'standings', 'transfers', 'venues', 'coaches', 
  'referees', 'livescores', 'client'
];

// Create REPL server with custom eval
const replServer = repl.start({
  prompt: `${colors.green}sportmonks> ${colors.reset}`,
  useColors: true,
  preview: false,  // Disable preview to avoid completer issues
  breakEvalOnSigint: true,
  eval: (cmd, context, filename, callback) => {
    // Check if trying to assign to a protected resource name
    const assignmentMatch = cmd.match(/^\s*(const|let|var)?\s*(\w+)\s*=/);
    if (assignmentMatch) {
      const varName = assignmentMatch[2];
      if (protectedNames.includes(varName)) {
        const error = new Error(
          `${colors.red}Cannot use '${varName}' as a variable name!${colors.reset}\n` +
          `${colors.yellow}'${varName}' is a SportMonks resource and cannot be overwritten.${colors.reset}\n` +
          `${colors.green}Try using a different name like:${colors.reset}\n` +
          `  const ${varName}Result = await ${varName}.search(...).get()\n` +
          `  const my${varName.charAt(0).toUpperCase() + varName.slice(1)} = await ${varName}.all().get()`
        );
        callback(error);
        return;
      }
    }
    
    // Use default eval for everything else
    const defaultEval = (repl as any).defaultEval;
    defaultEval(cmd, context, filename, callback);
  }
});

// Add client to context
replServer.context.client = client;
replServer.context.SportMonksClient = SportMonksClient;

// Add all resources directly to context for convenience
replServer.context.leagues = client.leagues;
replServer.context.teams = client.teams;
replServer.context.players = client.players;
replServer.context.fixtures = client.fixtures;
replServer.context.seasons = client.seasons;
replServer.context.squads = client.squads;
replServer.context.standings = client.standings;
replServer.context.transfers = client.transfers;
replServer.context.venues = client.venues;
replServer.context.coaches = client.coaches;
replServer.context.referees = client.referees;
replServer.context.livescores = client.livescores;

// Helper function to pretty print responses
replServer.context.pp = (obj: any) => {
  console.log(JSON.stringify(obj, null, 2));
};

// Helper function to print just the data from responses
replServer.context.data = (response: any) => {
  if (response && response.data) {
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } else {
    console.log('No data found in response');
    return null;
  }
};

// Simple type info helper
replServer.context.type = (obj: any) => {
  if (obj === null) {
    console.log('Type: null');
    return;
  }
  if (obj === undefined) {
    console.log('Type: undefined');
    return;
  }
  
  const type = typeof obj;
  
  if (type === 'object') {
    if (Array.isArray(obj)) {
      console.log(`Type: Array (length: ${obj.length})`);
      if (obj.length > 0) {
        console.log(`  Element type: ${typeof obj[0]}`);
      }
    } else {
      // Try to identify SportMonks types
      let typeName = 'Object';
      if ('data' in obj && 'pagination' in obj) typeName = 'PaginatedResponse';
      else if ('data' in obj && 'rate_limit' in obj) typeName = 'Response';
      else if ('name' in obj && 'sport_id' in obj) {
        if ('founded' in obj) typeName = 'Team';
        else if ('date_of_birth' in obj) typeName = 'Player';
        else if ('has_jerseys' in obj) typeName = 'League';
        else if ('starting_at' in obj) typeName = 'Fixture';
      }
      
      console.log(`Type: ${typeName}`);
      console.log(`Properties: ${Object.keys(obj).slice(0, 10).join(', ')}${Object.keys(obj).length > 10 ? '...' : ''}`);
    }
  } else {
    console.log(`Type: ${type}`);
    if (type === 'string') console.log(`Value: "${obj}"`);
    else if (type === 'number' || type === 'boolean') console.log(`Value: ${obj}`);
  }
};

// Add example queries
replServer.context.examples = () => {
  console.log(`
${colors.cyan}Example queries:${colors.reset}

${colors.yellow}// Basic queries${colors.reset}
await leagues.all().limit(5).get()
await teams.byId(1).include(['country', 'venue']).get()
await players.search('Ronaldo').limit(10).get()

${colors.yellow}// With includes${colors.reset}
await fixtures.byDate('2024-01-15').include(['localteam', 'visitorteam']).get()
await leagues.byId(8).include(['country', 'seasons']).get()

${colors.yellow}// Complex queries${colors.reset}
await teams.bySeason(19735).include(['country']).filter('national_team', 'true').get()
await fixtures.headToHead(1, 14).include(['events', 'lineups']).limit(5).get()

${colors.yellow}// Even simpler - direct calls${colors.reset}
await teams.search('Liverpool').get()
await players.latest().limit(20).get()
await livescores.inplay().include(['localteam', 'visitorteam']).get()

${colors.yellow}// Today's fixtures${colors.reset}
const today = new Date().toISOString().split('T')[0]
await fixtures.byDate(today).include(['localteam', 'visitorteam']).get()

${colors.yellow}// Helper functions${colors.reset}
pp(response)          // Pretty print full response
data(response)        // Print just the data array
type(obj)             // Show type information
examples()            // Show these examples
resources()           // List all available resources

${colors.yellow}// Type checking${colors.reset}
const team = await teams.byId(1).get()
type(team)            // Shows: Response
type(team.data)       // Shows: Team
type(team.data.name)  // Shows: string

${colors.yellow}// Store results${colors.reset}
const liverpool = await teams.search('Liverpool').get()
const premierLeague = await leagues.search('Premier League').get()

${colors.green}// Protected names${colors.reset}
// Resource names are protected - you'll get a helpful error if you try to overwrite them
const playerResults = await players.search('Salah').get()  ${colors.dim}// ✅ Good${colors.reset}
// const players = ...  ${colors.dim}// ❌ This will show an error with suggestions${colors.reset}
`);
};

// List available resources
replServer.context.resources = () => {
  console.log(`
${colors.cyan}Available resources (no need to type 'client.'):${colors.reset}

${colors.yellow}leagues${colors.reset}
  .all()              .byId(id)           .byDate(date)
  .live()             .byCountry(id)      .byTeam(id)
  .currentByTeam(id)  .search(query)

${colors.yellow}teams${colors.reset}
  .all()              .byId(id)           .byCountry(id)
  .bySeason(id)       .search(query)

${colors.yellow}players${colors.reset}
  .all()              .byId(id)           .byCountry(id)
  .search(query)      .latest()

${colors.yellow}fixtures${colors.reset}
  .all()              .byId(id)           .byDate(date)
  .byDateRange(start, end)                .headToHead(team1, team2)
  .search(query)      .latest()           .byIds([ids])
  .byTeamAndDateRange(teamId, start, end)

${colors.yellow}seasons${colors.reset}
  .all()              .byId(id)           .byTeam(id)
  .search(query)

${colors.yellow}squads${colors.reset}
  .season(id).team(id)

${colors.yellow}standings${colors.reset}
  .all()              .bySeason(id)       .byRound(id)
  .byStageId(id)      .correctionsBySeason(id)

${colors.yellow}transfers${colors.reset}
  .all()              .byId(id)           .latest()
  .between(start, end).byTeam(id)        .byPlayer(id)

${colors.yellow}venues${colors.reset}
  .all()              .byId(id)           .bySeason(id)
  .search(query)

${colors.yellow}coaches${colors.reset}
  .all()              .byId(id)           .byCountry(id)
  .byTeam(id)         .search(query)      .latest()

${colors.yellow}referees${colors.reset}
  .all()              .byId(id)           .byCountry(id)
  .bySeason(id)       .search(query)

${colors.yellow}livescores${colors.reset}
  .all()              .inplay()           .latest()

${colors.dim}Note: All methods return a QueryBuilder. Remember to call .get() at the end!${colors.reset}
`);
};

replServer.setupHistory(path.join(process.cwd(), '.sportmonks_repl_history'), (err) => {
  if (err) console.error('Failed to setup history:', err);
});

console.log(`
${colors.dim}Type ${colors.cyan}examples()${colors.dim} to see example queries${colors.reset}
${colors.dim}Type ${colors.cyan}resources()${colors.dim} to see all available resources${colors.reset}
${colors.dim}Type ${colors.cyan}.exit${colors.dim} or press ${colors.cyan}Ctrl+C${colors.dim} to exit${colors.reset}
`);

// Handle exit
replServer.on('exit', () => {
  console.log(`\n${colors.cyan}👋 Goodbye!${colors.reset}`);
  process.exit(0);
});