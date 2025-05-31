#!/usr/bin/env node

import repl from 'repl';
import path from 'path';
import { SportMonksClient } from '../src';
import dotenv from 'dotenv';
import { inspect } from 'util';

// Load environment variables
dotenv.config();

// ANSI color codes
const colors = {
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m'
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

console.log(`${colors.cyan}${colors.bold}🚀 SportMonks TypeScript SDK REPL (Advanced)${colors.reset}`);
console.log(`${colors.dim}API Key: ${apiKey.substring(0, 10)}...${colors.reset}`);
console.log('');

// Create client instance
const client = new SportMonksClient(apiKey);

// Store last result for easy access
let lastResult: any = null;

// List of protected resource names
const protectedNames = [
  'leagues', 'teams', 'players', 'fixtures', 'seasons', 
  'squads', 'standings', 'transfers', 'venues', 'coaches', 
  'referees', 'livescores', 'client', '_', 'pp', 'data', 
  'type', 'browse', 'save', 'first', 'table', 'examples', 
  'league', 'team', 'player', 'fixture'
];

// Create REPL server with custom eval
const replServer = repl.start({
  prompt: `${colors.green}sportmonks> ${colors.reset}`,
  useColors: true,
  preview: false,
  breakEvalOnSigint: true,
  eval: (cmd, context, filename, callback) => {
    // Check if trying to assign to a protected resource name
    const assignmentMatch = cmd.match(/^\s*(const|let|var)?\s*(\w+)\s*=/);
    if (assignmentMatch) {
      const varName = assignmentMatch[2];
      if (protectedNames.includes(varName)) {
        const error = new Error(
          `\n${colors.red}${colors.bold}Protected name: '${varName}'${colors.reset}\n` +
          `${colors.yellow}This is a built-in resource/function and cannot be overwritten.${colors.reset}\n\n` +
          `${colors.green}Suggestions:${colors.reset}\n` +
          `  • const ${varName}Data = await ${varName}...get()\n` +
          `  • const ${varName}Result = await ${varName}...get()\n` +
          `  • const my${varName.charAt(0).toUpperCase() + varName.slice(1)} = await ${varName}...get()\n`
        );
        callback(error);
        return;
      }
    }
    
    // Use default eval for everything else
    const defaultEval = (repl as any).defaultEval;
    defaultEval(cmd, context, filename, callback);
  },
  writer: (output: any) => {
    lastResult = output;
    return inspect(output, { 
      colors: true, 
      depth: 3,
      maxArrayLength: 10,
      breakLength: 80
    });
  }
});

// Add to context
replServer.context.client = client;
replServer.context.SportMonksClient = SportMonksClient;
replServer.context._ = () => lastResult;

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

// Helper functions
replServer.context.pp = (obj: any, depth = 3) => {
  console.log(inspect(obj, { colors: true, depth, maxArrayLength: null }));
};

// Type information helper
replServer.context.type = (obj: any, path?: string) => {
  if (path) {
    // Navigate to nested property
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        console.log(`${colors.red}Property '${part}' not found${colors.reset}`);
        return;
      }
    }
    obj = current;
  }

  const typeInfo = getTypeInfo(obj);
  console.log(`${colors.cyan}Type: ${colors.yellow}${typeInfo.type}${colors.reset}`);
  
  if (typeInfo.properties) {
    console.log(`${colors.cyan}Properties:${colors.reset}`);
    typeInfo.properties.forEach(prop => {
      console.log(`  ${colors.green}${prop.name}${colors.reset}: ${colors.dim}${prop.type}${colors.reset}`);
    });
  }
  
  if (typeInfo.sample !== undefined) {
    console.log(`${colors.cyan}Sample value:${colors.reset} ${typeInfo.sample}`);
  }
};

replServer.context.data = (response: any) => {
  if (response && response.data) {
    replServer.context.pp(response.data);
    return response.data;
  } else {
    console.log('No data found in response');
    return null;
  }
};

replServer.context.first = (response: any) => {
  if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
    replServer.context.pp(response.data[0]);
    return response.data[0];
  } else {
    console.log('No data found in response');
    return null;
  }
};

replServer.context.table = (data: any[]) => {
  if (!Array.isArray(data)) {
    console.log('Not an array');
    return;
  }
  console.table(data.slice(0, 20));
};

replServer.context.save = (name: string, value: any) => {
  replServer.context[name] = value;
  console.log(`${colors.green}Saved as '${name}'${colors.reset}`);
};

// Quick access functions
replServer.context.league = async (id: number) => {
  const response = await client.leagues.byId(id).include(['country', 'seasons']).get();
  console.log(`${colors.magenta}League: ${response.data.name}${colors.reset}`);
  return response;
};

replServer.context.team = async (id: number) => {
  const response = await client.teams.byId(id).include(['country', 'venue', 'coach']).get();
  console.log(`${colors.magenta}Team: ${response.data.name}${colors.reset}`);
  return response;
};

replServer.context.player = async (id: number) => {
  const response = await client.players.byId(id).include(['team', 'country', 'position']).get();
  console.log(`${colors.magenta}Player: ${response.data.display_name}${colors.reset}`);
  return response;
};

replServer.context.fixture = async (id: number) => {
  const response = await client.fixtures.byId(id).include(['localteam', 'visitorteam', 'league']).get();
  console.log(`${colors.magenta}Fixture: ${response.data.name}${colors.reset}`);
  return response;
};

// Add example queries
replServer.context.examples = () => {
  console.log(`
${colors.cyan}${colors.bold}Quick Access Functions:${colors.reset}

${colors.yellow}await league(8)${colors.reset}        // Get Premier League details
${colors.yellow}await team(1)${colors.reset}         // Get team details
${colors.yellow}await player(580)${colors.reset}     // Get player details
${colors.yellow}await fixture(123)${colors.reset}    // Get fixture details

${colors.cyan}${colors.bold}Example Queries:${colors.reset}

${colors.yellow}// Today's fixtures${colors.reset}
const today = new Date().toISOString().split('T')[0]
await client.fixtures.byDate(today).include(['localteam', 'visitorteam']).get()

${colors.yellow}// Premier League teams${colors.reset}
await client.teams.bySeason(19735).include(['country', 'venue']).get()

${colors.yellow}// Search with filters${colors.reset}
await client.players.search('Mohamed').filter('position_id', 27).limit(10).get()

${colors.yellow}// Complex includes${colors.reset}
await client.fixtures.byId(18535517)
  .include(['localteam.country', 'visitorteam.country', 'events.player', 'lineups.player'])
  .get()

${colors.cyan}${colors.bold}Helper Functions:${colors.reset}

${colors.yellow}_()${colors.reset}             // Get last result
${colors.yellow}pp(obj)${colors.reset}         // Pretty print with color
${colors.yellow}data(res)${colors.reset}       // Extract and print data array
${colors.yellow}first(res)${colors.reset}      // Get first item from data array
${colors.yellow}table(array)${colors.reset}    // Display as table
${colors.yellow}save('name', value)${colors.reset}  // Save value to variable

${colors.cyan}${colors.bold}Type Browsing:${colors.reset}

${colors.yellow}type(obj)${colors.reset}       // Show type info for an object
${colors.yellow}type(obj, 'path.to.property')${colors.reset}  // Show type of nested property
${colors.yellow}browse(obj)${colors.reset}     // Interactive type browser with all properties

${colors.yellow}// Example type browsing${colors.reset}
const team = await teams.byId(1).include(['country', 'venue']).get()
type(team)                    // Shows: SingleResponse
type(team, 'data')            // Shows: Team
type(team, 'data.name')       // Shows: string
browse(team.data)             // Browse all Team properties

${colors.cyan}${colors.bold}Tips:${colors.reset}
- Use ${colors.yellow}await${colors.reset} for all API calls
- Press ${colors.yellow}Tab${colors.reset} for autocomplete
- Use ${colors.yellow}_()${colors.reset} to access the last result
- Results are auto-truncated for readability
`);
};

// Custom completer with method signatures
replServer.defineCommand('methods', {
  help: 'Show available methods for a resource',
  action(resource: string) {
    const methods: Record<string, string[]> = {
      leagues: [
        'all() → QueryBuilder',
        'byId(id: number) → QueryBuilder',
        'byDate(date: string) → QueryBuilder',
        'live() → QueryBuilder',
        'byCountry(countryId: number) → QueryBuilder',
        'byTeam(teamId: number) → QueryBuilder',
        'currentByTeam(teamId: number) → QueryBuilder',
        'search(query: string) → QueryBuilder'
      ],
      teams: [
        'all() → QueryBuilder',
        'byId(id: number) → QueryBuilder',
        'byCountry(countryId: number) → QueryBuilder',
        'bySeason(seasonId: number) → QueryBuilder',
        'search(query: string) → QueryBuilder'
      ],
      players: [
        'all() → QueryBuilder',
        'byId(id: number) → QueryBuilder',
        'byCountry(countryId: number) → QueryBuilder',
        'search(query: string) → QueryBuilder',
        'latest() → QueryBuilder'
      ],
      fixtures: [
        'all() → QueryBuilder',
        'byId(id: number) → QueryBuilder',
        'byDate(date: string) → QueryBuilder',
        'byDateRange(startDate: string, endDate: string) → QueryBuilder',
        'byTeam(teamId: number) → QueryBuilder',
        'byTeamAndDateRange(teamId: number, startDate: string, endDate: string) → QueryBuilder',
        'headToHead(team1Id: number, team2Id: number) → QueryBuilder',
        'search(query: string) → QueryBuilder',
        'upcomingByMarketId(marketId: number) → QueryBuilder',
        'upcomingByTvStation(tvStationId: number) → QueryBuilder',
        'pastByTvStation(tvStationId: number) → QueryBuilder',
        'latest() → QueryBuilder',
        'lastUpdated() → QueryBuilder'
      ]
    };

    const resourceMethods = methods[resource.replace('client.', '')];
    if (resourceMethods) {
      console.log(`\n${colors.cyan}Methods for ${resource}:${colors.reset}\n`);
      resourceMethods.forEach(method => {
        console.log(`  ${colors.yellow}${method}${colors.reset}`);
      });
      console.log('');
    } else {
      console.log(`Unknown resource: ${resource}`);
    }
    this.displayPrompt();
  }
});

// Setup history
replServer.setupHistory(path.join(process.cwd(), '.sportmonks_repl_history'), (err) => {
  if (err) console.error('Failed to setup history:', err);
});

console.log(`
${colors.dim}Type ${colors.cyan}examples()${colors.dim} to see example queries${colors.reset}
${colors.dim}Type ${colors.cyan}.methods <resource>${colors.dim} to see resource methods${colors.reset}
${colors.dim}Type ${colors.cyan}.help${colors.dim} to see all commands${colors.reset}
${colors.dim}Type ${colors.cyan}.exit${colors.dim} or press ${colors.cyan}Ctrl+D${colors.dim} to exit${colors.reset}
`);

// Type information helper
function getTypeInfo(obj: any): { type: string; properties?: Array<{name: string, type: string}>; sample?: any } {
  if (obj === null) return { type: 'null' };
  if (obj === undefined) return { type: 'undefined' };
  
  const type = typeof obj;
  
  if (type === 'object') {
    if (Array.isArray(obj)) {
      const elementType = obj.length > 0 ? getTypeInfo(obj[0]).type : 'unknown';
      return { 
        type: `Array<${elementType}> (length: ${obj.length})`,
        sample: obj.length > 0 ? obj[0] : undefined
      };
    }
    
    // Check for specific SportMonks types based on properties
    const typeName = inferSportMonksType(obj);
    
    // Get properties
    const properties = Object.keys(obj)
      .filter(key => !key.startsWith('_'))
      .slice(0, 20)
      .map(key => ({
        name: key,
        type: getSimpleType(obj[key])
      }));
    
    return { 
      type: typeName || 'Object',
      properties 
    };
  }
  
  return { type, sample: type === 'string' ? `"${obj}"` : obj };
}

function inferSportMonksType(obj: any): string | null {
  // Check for response types
  if ('data' in obj && 'pagination' in obj) return 'PaginatedResponse';
  if ('data' in obj && 'rate_limit' in obj) return 'SingleResponse';
  
  // Check for entity types based on unique properties
  if ('sport_id' in obj) {
    if ('founded' in obj && 'venue_id' in obj) return 'Team';
    if ('date_of_birth' in obj && 'position_id' in obj) return 'Player';
    if ('starting_at' in obj && 'state_id' in obj) return 'Fixture';
    if ('has_jerseys' in obj) return 'League';
    if ('league_id' in obj && 'finished' in obj) return 'Season';
    if ('capacity' in obj && 'surface' in obj) return 'Venue';
    if ('nationality_id' in obj && !('position_id' in obj)) return 'Coach';
    if ('common_name' in obj && !('date_of_birth' in obj)) return 'Referee';
  }
  
  // Check for other types
  if ('continent' in obj && 'sub_region' in obj) return 'Country';
  if ('developer_name' in obj && 'model_type' in obj) return 'Type';
  if ('player_id' in obj && 'jersey_number' in obj) return 'SquadPlayer';
  
  return null;
}

function getSimpleType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const type = typeof value;
  
  if (type === 'object') {
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }
    const customType = inferSportMonksType(value);
    return customType || 'Object';
  }
  
  return type;
}

// Add a browse function for exploring types
replServer.context.browse = (obj: any) => {
  if (!obj || typeof obj !== 'object') {
    console.log(`${colors.red}Can only browse objects${colors.reset}`);
    return;
  }
  
  const typeInfo = getTypeInfo(obj);
  console.log(`\n${colors.bold}${colors.cyan}=== Type Browser ===${colors.reset}`);
  console.log(`${colors.yellow}Type: ${typeInfo.type}${colors.reset}\n`);
  
  if (Array.isArray(obj)) {
    console.log(`${colors.dim}Array with ${obj.length} items${colors.reset}`);
    if (obj.length > 0) {
      console.log(`${colors.dim}First item:${colors.reset}`);
      replServer.context.browse(obj[0]);
    }
    return;
  }
  
  // Group properties by type
  const props = typeInfo.properties || [];
  const grouped: Record<string, string[]> = {};
  
  props.forEach(prop => {
    const type = prop.type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(prop.name);
  });
  
  // Display grouped properties
  Object.entries(grouped).forEach(([type, names]) => {
    console.log(`${colors.cyan}${type}:${colors.reset}`);
    names.forEach(name => {
      const value = obj[name];
      let preview = '';
      
      if (type === 'string' && value) {
        preview = ` = "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`;
      } else if (type === 'number' || type === 'boolean') {
        preview = ` = ${value}`;
      } else if (type.startsWith('Array')) {
        preview = ` (${value.length} items)`;
      }
      
      console.log(`  ${colors.green}${name}${colors.reset}${colors.dim}${preview}${colors.reset}`);
    });
    console.log('');
  });
  
  console.log(`${colors.dim}Use type(obj, 'property') to explore nested properties${colors.reset}`);
  console.log(`${colors.dim}Use obj.property to access values${colors.reset}`);
};

// Handle exit
replServer.on('exit', () => {
  console.log(`\n${colors.cyan}👋 Goodbye!${colors.reset}`);
  process.exit(0);
});