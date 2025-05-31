/**
 * Unit tests for REPL helper functions
 */

// Mock the type detection functions from the REPL
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

// Check if variable name is protected
function isProtectedName(name: string): boolean {
  const protectedNames = [
    'leagues',
    'teams',
    'players',
    'fixtures',
    'seasons',
    'squads',
    'standings',
    'transfers',
    'venues',
    'coaches',
    'referees',
    'livescores',
    'client'
  ];
  return protectedNames.includes(name);
}

describe('REPL Helper Functions', () => {
  describe('Type Detection', () => {
    describe('inferSportMonksType', () => {
      test('should identify Team type', () => {
        const team = {
          sport_id: 1,
          founded: 1900,
          venue_id: 123,
          name: 'Test Team'
        };
        expect(inferSportMonksType(team)).toBe('Team');
      });

      test('should identify Player type', () => {
        const player = {
          sport_id: 1,
          date_of_birth: '1990-01-01',
          position_id: 25,
          name: 'Test Player'
        };
        expect(inferSportMonksType(player)).toBe('Player');
      });

      test('should identify Fixture type', () => {
        const fixture = {
          sport_id: 1,
          starting_at: '2024-01-01 15:00:00',
          state_id: 5,
          name: 'Team A vs Team B'
        };
        expect(inferSportMonksType(fixture)).toBe('Fixture');
      });

      test('should identify League type', () => {
        const league = {
          sport_id: 1,
          has_jerseys: true,
          name: 'Test League'
        };
        expect(inferSportMonksType(league)).toBe('League');
      });

      test('should identify PaginatedResponse', () => {
        const response = {
          data: [],
          pagination: { count: 0, has_more: false }
        };
        expect(inferSportMonksType(response)).toBe('PaginatedResponse');
      });

      test('should identify SingleResponse', () => {
        const response = {
          data: {},
          rate_limit: { remaining: 1000 }
        };
        expect(inferSportMonksType(response)).toBe('SingleResponse');
      });

      test('should return null for unknown types', () => {
        expect(inferSportMonksType({})).toBe(null);
        expect(inferSportMonksType({ random: 'data' })).toBe(null);
      });
    });

    describe('getSimpleType', () => {
      test('should handle primitive types', () => {
        expect(getSimpleType('test')).toBe('string');
        expect(getSimpleType(123)).toBe('number');
        expect(getSimpleType(true)).toBe('boolean');
        expect(getSimpleType(null)).toBe('null');
        expect(getSimpleType(undefined)).toBe('undefined');
      });

      test('should handle arrays', () => {
        expect(getSimpleType([])).toBe('Array(0)');
        expect(getSimpleType([1, 2, 3])).toBe('Array(3)');
      });

      test('should identify SportMonks types', () => {
        const team = {
          sport_id: 1,
          founded: 1900,
          venue_id: 123
        };
        expect(getSimpleType(team)).toBe('Team');
      });

      test('should default to Object for unknown objects', () => {
        expect(getSimpleType({})).toBe('Object');
        expect(getSimpleType({ unknown: 'property' })).toBe('Object');
      });
    });
  });

  describe('Protected Names', () => {
    test('should identify protected resource names', () => {
      expect(isProtectedName('teams')).toBe(true);
      expect(isProtectedName('players')).toBe(true);
      expect(isProtectedName('fixtures')).toBe(true);
      expect(isProtectedName('client')).toBe(true);
    });

    test('should allow non-protected names', () => {
      expect(isProtectedName('myTeams')).toBe(false);
      expect(isProtectedName('playerData')).toBe(false);
      expect(isProtectedName('result')).toBe(false);
    });
  });

  describe('Assignment Detection', () => {
    const checkAssignment = (cmd: string): { isAssignment: boolean; varName?: string } => {
      const match = cmd.match(/^\s*(const|let|var)?\s*(\w+)\s*=/);
      if (match) {
        return { isAssignment: true, varName: match[2] };
      }
      return { isAssignment: false };
    };

    test('should detect const assignments', () => {
      const result = checkAssignment('const players = await players.search("test").get()');
      expect(result.isAssignment).toBe(true);
      expect(result.varName).toBe('players');
    });

    test('should detect let assignments', () => {
      const result = checkAssignment('let teams = []');
      expect(result.isAssignment).toBe(true);
      expect(result.varName).toBe('teams');
    });

    test('should detect var assignments', () => {
      const result = checkAssignment('var fixtures = null');
      expect(result.isAssignment).toBe(true);
      expect(result.varName).toBe('fixtures');
    });

    test('should detect implicit assignments', () => {
      const result = checkAssignment('leagues = await leagues.all().get()');
      expect(result.isAssignment).toBe(true);
      expect(result.varName).toBe('leagues');
    });

    test('should not detect non-assignments', () => {
      expect(checkAssignment('teams.all().get()')).toEqual({ isAssignment: false });
      expect(checkAssignment('console.log(players)')).toEqual({ isAssignment: false });
      expect(checkAssignment('await fixtures.latest().get()')).toEqual({ isAssignment: false });
    });
  });
});

describe('REPL Type Information', () => {
  const getTypeInfo = (
    obj: any
  ): { type: string; properties?: Array<{ name: string; type: string }> } => {
    if (obj === null) return { type: 'null' };
    if (obj === undefined) return { type: 'undefined' };

    const type = typeof obj;

    if (type === 'object') {
      if (Array.isArray(obj)) {
        const elementType = obj.length > 0 ? getTypeInfo(obj[0]).type : 'unknown';
        return {
          type: `Array<${elementType}> (length: ${obj.length})`
        };
      }

      const typeName = inferSportMonksType(obj);

      const properties = Object.keys(obj)
        .filter(key => !key.startsWith('_'))
        .slice(0, 5)
        .map(key => ({
          name: key,
          type: getSimpleType(obj[key])
        }));

      return {
        type: typeName || 'Object',
        properties
      };
    }

    return { type };
  };

  test('should provide type info for teams', () => {
    const team = {
      id: 1,
      sport_id: 1,
      name: 'Manchester United',
      founded: 1878,
      venue_id: 5,
      short_code: 'MUN'
    };

    const info = getTypeInfo(team);
    expect(info.type).toBe('Team');
    expect(info.properties).toContainEqual({ name: 'name', type: 'string' });
    expect(info.properties).toContainEqual({ name: 'founded', type: 'number' });
  });

  test('should provide type info for arrays', () => {
    const players = [
      { sport_id: 1, date_of_birth: '1990-01-01', position_id: 25 },
      { sport_id: 1, date_of_birth: '1992-01-01', position_id: 26 }
    ];

    const info = getTypeInfo(players);
    expect(info.type).toBe('Array<Player> (length: 2)');
  });

  test('should handle empty arrays', () => {
    const info = getTypeInfo([]);
    expect(info.type).toBe('Array<unknown> (length: 0)');
  });

  test('should handle nested objects', () => {
    const response = {
      data: {
        id: 1,
        sport_id: 1,
        name: 'Test League',
        has_jerseys: true
      },
      pagination: { count: 1, has_more: false }
    };

    const info = getTypeInfo(response);
    expect(info.type).toBe('PaginatedResponse');
    expect(info.properties).toContainEqual({ name: 'data', type: 'League' });
  });
});
