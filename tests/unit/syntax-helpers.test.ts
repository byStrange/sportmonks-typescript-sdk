import axios from 'axios';
import { SportMonksClient } from '../../src';
import { SportMonksSyntaxBuilder } from '../../src/types/sportmonks-syntax';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SportMonks Syntax Helpers in SDK', () => {
  let client: SportMonksClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      defaults: { params: {}, timeout: 30000 },
      interceptors: { response: { use: jest.fn() } }
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

    client = new SportMonksClient('test-api-key');
  });

  describe('includeFields() usage', () => {
    test('should use includeFields for optimized team queries', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.teams
        .all()
        .includeFields('country', ['name', 'iso2'])
        .includeFields('venue', ['name', 'city', 'capacity'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams', {
        params: {
          include: 'country:name,iso2;venue:name,city,capacity'
        }
      });
    });

    test('should combine includeFields with regular includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures
        .byId(123)
        .include('league')
        .includeFields('localteam', ['name', 'short_code'])
        .includeFields('visitorteam', ['name', 'short_code'])
        .include('venue')
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/123', {
        params: {
          include: 'league;localteam:name,short_code;visitorteam:name,short_code;venue'
        }
      });
    });
  });

  describe('withIncludes() usage', () => {
    test('should use withIncludes for complex fixture queries', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.fixtures
        .byDate('2024-01-15')
        .withIncludes({
          localteam: ['name', 'logo'],
          visitorteam: ['name', 'logo'],
          events: ['player_name', 'minute', 'type'],
          lineups: true,
          venue: ['name', 'city']
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/date/2024-01-15', {
        params: {
          include:
            'localteam:name,logo;visitorteam:name,logo;events:player_name,minute,type;lineups;venue:name,city'
        }
      });
    });

    test('should handle mixed include types with withIncludes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.players
        .byId(123)
        .withIncludes({
          team: true,
          'team.country': ['name', 'iso2'],
          position: true,
          statistics: ['goals', 'assists', 'yellow_cards']
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/123', {
        params: {
          include: 'team;team.country:name,iso2;position;statistics:goals,assists,yellow_cards'
        }
      });
    });
  });

  describe('Array filters', () => {
    test('should handle array filters for multiple leagues', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.fixtures
        .all()
        .filter('league_id', [8, 82, 384]) // Premier League, Bundesliga, Serie A
        .filter('status', 'FT')
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures', {
        params: {
          filters: 'league_id:8,82,384;status:FT'
        }
      });
    });

    test('should handle array filters for event types', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.fixtures
        .byId(123)
        .include('events')
        .filter('eventTypes', [14, 15, 16]) // Goals, own goals, penalties
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/123', {
        params: {
          include: 'events',
          filters: 'eventTypes:14,15,16'
        }
      });
    });
  });

  describe('SportMonksSyntaxBuilder with SDK', () => {
    test('should use SportMonksSyntaxBuilder for complex queries', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      const includeConfig = {
        localteam: { fields: ['name', 'short_code'] },
        visitorteam: { fields: ['name', 'short_code'] },
        league: {
          fields: true,
          nested: {
            country: { fields: ['name'] }
          }
        },
        events: { fields: ['player_name', 'minute', 'type'] }
      };

      const includes = SportMonksSyntaxBuilder.buildIncludes(includeConfig);

      await client.fixtures.byDateRange('2024-01-01', '2024-01-31').include(includes).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/fixtures/between/2024-01-01/2024-01-31',
        {
          params: {
            include:
              'localteam:name,short_code;visitorteam:name,short_code;league;league.country:name;events:player_name,minute,type'
          }
        }
      );
    });

    test('should combine SportMonksSyntaxBuilder with direct methods', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      const filters = SportMonksSyntaxBuilder.buildFilters({
        league_id: [8, 82],
        status: 'FT',
        season_id: 21646
      });

      // Parse filters to apply individually
      const filterPairs = filters.split(';').map(f => {
        const [key, value] = f.split(':');
        return { key, value };
      });

      let query = client.fixtures.all();
      filterPairs.forEach(({ key, value }) => {
        query = query.filter(key, value.includes(',') ? value.split(',') : value);
      });

      await query.perPage(100).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures', {
        params: {
          filters: 'league_id:8,82;status:FT;season_id:21646',
          per_page: 100
        }
      });
    });
  });

  describe('Real-world usage examples', () => {
    test('should optimize live match queries with field selection', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.livescores
        .inplay()
        .withIncludes({
          localteam: ['name', 'short_code', 'logo'],
          visitorteam: ['name', 'short_code', 'logo'],
          events: ['player_name', 'minute', 'type', 'result'],
          league: ['name'],
          'league.country': ['name', 'iso2']
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/livescores/inplay', {
        params: {
          include:
            'localteam:name,short_code,logo;visitorteam:name,short_code,logo;events:player_name,minute,type,result;league:name;league.country:name,iso2'
        }
      });
    });

    test('should optimize team squad queries', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: [] }
      });

      await client.teams
        .byId(1)
        .withIncludes({
          'squad.player': ['display_name', 'position_id', 'jersey_number'],
          'squad.player.position': ['name'],
          'squad.player.country': ['name', 'iso2']
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/1', {
        params: {
          include:
            'squad.player:display_name,position_id,jersey_number;squad.player.position:name;squad.player.country:name,iso2'
        }
      });
    });
  });
});
