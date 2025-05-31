/**
 * Mock data helpers for tests
 */

import { League, LeagueType, LeagueSubType } from '../../src';

/**
 * Create a mock response with SportMonks API structure
 */
export function createMockResponse(
  data: any[],
  options: {
    pagination?: boolean | any;
    rateLimit?: Partial<any>;
    subscription?: boolean;
  } = {}
) {
  const response: any = { data };

  if (options.pagination !== false) {
    response.pagination = {
      count: data.length,
      per_page: 25,
      current_page: 1,
      next_page: null,
      has_more: false,
      ...(typeof options.pagination === 'object' ? options.pagination : {})
    };
  }

  response.rate_limit = {
    resets_in_seconds: 3600,
    remaining: 2999,
    requested_entity: 'League',
    ...options.rateLimit
  };

  response.timezone = 'UTC';

  if (options.subscription !== false) {
    response.subscription = {
      meta: [],
      plans: [],
      add_ons: [],
      widgets: []
    };
  }

  return response;
}

/**
 * Create a mock League entity
 */
export function createMockLeague(overrides: Partial<League> = {}): League {
  return {
    id: 8,
    sport_id: 1,
    country_id: 462,
    name: 'Premier League',
    active: true,
    short_code: 'UK PL',
    image_path: 'https://cdn.sportmonks.com/images/soccer/leagues/8.png',
    type: LeagueType.LEAGUE,
    sub_type: LeagueSubType.TOP_LEVEL,
    last_played_at: '2024-01-15',
    category: 1,
    has_jerseys: false,
    ...overrides
  };
}

/**
 * Create a mock Country entity
 */
export function createMockCountry(overrides: any = {}) {
  return {
    id: 462,
    name: 'England',
    official_name: 'England',
    fifa_name: 'ENG',
    iso2: 'EN',
    iso3: 'ENG',
    latitude: '52.0',
    longitude: '-0.1',
    borders: [],
    image_path: 'https://cdn.sportmonks.com/images/countries/england.png',
    ...overrides
  };
}

/**
 * Create a mock Team entity
 */
export function createMockTeam(overrides: any = {}) {
  return {
    id: 1,
    sport_id: 1,
    country_id: 462,
    venue_id: 100,
    gender: 'male',
    name: 'Manchester United',
    short_code: 'MUN',
    image_path: 'https://cdn.sportmonks.com/images/soccer/teams/1.png',
    founded: 1878,
    type: 'domestic',
    placeholder: false,
    last_played_at: '2024-01-15',
    ...overrides
  };
}

/**
 * Create a mock Player entity
 */
export function createMockPlayer(overrides: any = {}) {
  return {
    id: 1,
    sport_id: 1,
    country_id: 462,
    nationality_id: 462,
    city_id: null,
    position_id: 1,
    detailed_position_id: 1,
    type_id: 1,
    common_name: 'J. Doe',
    firstname: 'John',
    lastname: 'Doe',
    name: 'John Doe',
    display_name: 'John Doe',
    image_path: 'https://cdn.sportmonks.com/images/soccer/players/1.png',
    height: 180,
    weight: 75,
    date_of_birth: '1990-01-01',
    gender: 'male',
    ...overrides
  };
}

/**
 * Create a mock Standing entity
 */
export function createMockStanding(overrides: any = {}) {
  return {
    id: 1,
    participant_id: 1,
    sport_id: 1,
    league_id: 8,
    season_id: 19735,
    stage_id: 77457866,
    group_id: null,
    round_id: 274719,
    standing_rule_id: 1,
    position: 1,
    result: null,
    points: 45,
    wins: 14,
    losses: 2,
    draws: 3,
    goal_difference: 25,
    goals_for: 42,
    goals_against: 17,
    ...overrides
  };
}

/**
 * Create a mock Referee entity
 */
export function createMockReferee(overrides: any = {}) {
  return {
    id: 1,
    sport_id: 1,
    country_id: 462,
    city_id: null,
    common_name: 'M. Oliver',
    firstname: 'Michael',
    lastname: 'Oliver',
    name: 'Michael Oliver',
    display_name: 'Michael Oliver',
    image_path: 'https://cdn.sportmonks.com/images/soccer/referees/1.png',
    date_of_birth: '1985-02-20',
    gender: 'male',
    ...overrides
  };
}

/**
 * Helper to simulate API delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
