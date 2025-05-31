import { SportMonksSyntaxBuilder } from '../../src/types/sportmonks-syntax';
import { QueryBuilder } from '../../src/core/query-builder';
import { BaseResource } from '../../src/core/base-resource';

describe('SportMonks Syntax Support', () => {
  let mockResource: BaseResource;
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = {
      get: jest.fn().mockResolvedValue({ data: { data: [] } })
    };
    mockResource = new (class extends BaseResource {
      constructor() {
        super(mockAxios, '/test');
      }
    })();
  });

  describe('QueryBuilder enhancements', () => {
    test('should support field selection with includeFields', async () => {
      const builder = new QueryBuilder(mockResource, '');

      await builder
        .includeFields('lineups', ['player_name', 'jersey_number'])
        .includeFields('events', ['player_name', 'minute'])
        .get();

      expect(mockAxios.get).toHaveBeenCalledWith('/test', {
        params: {
          include: 'lineups:player_name,jersey_number;events:player_name,minute'
        }
      });
    });

    test('should support withIncludes for complex configurations', async () => {
      const builder = new QueryBuilder(mockResource, '');

      await builder
        .withIncludes({
          lineups: ['player_name', 'jersey_number'],
          events: ['player_name', 'minute', 'type'],
          participants: true,
          venue: ['name', 'capacity']
        })
        .get();

      expect(mockAxios.get).toHaveBeenCalledWith('/test', {
        params: {
          include:
            'lineups:player_name,jersey_number;events:player_name,minute,type;participants;venue:name,capacity'
        }
      });
    });

    test('should support multiple filter values', async () => {
      const builder = new QueryBuilder(mockResource, '');

      await builder.filter('eventTypes', [14, 15, 16]).filter('status', 'FT').get();

      expect(mockAxios.get).toHaveBeenCalledWith('/test', {
        params: {
          filters: 'eventTypes:14,15,16;status:FT'
        }
      });
    });

    test('should handle string includes for complex syntax', async () => {
      const builder = new QueryBuilder(mockResource, '');

      await builder.include('lineups:player_name;events:minute,type').get();

      expect(mockAxios.get).toHaveBeenCalledWith('/test', {
        params: {
          include: 'lineups:player_name;events:minute,type'
        }
      });
    });
  });

  describe('SportMonksSyntaxBuilder', () => {
    test('should build simple includes', () => {
      const result = SportMonksSyntaxBuilder.buildIncludes({
        lineups: true,
        events: true,
        participants: true
      });

      expect(result).toBe('lineups;events;participants');
    });

    test('should build includes with field selection', () => {
      const result = SportMonksSyntaxBuilder.buildIncludes({
        lineups: { fields: ['player_name', 'jersey_number'] },
        events: { fields: ['player_name', 'minute'] }
      });

      expect(result).toBe('lineups:player_name,jersey_number;events:player_name,minute');
    });

    test('should build nested includes', () => {
      const result = SportMonksSyntaxBuilder.buildIncludes({
        league: {
          fields: true,
          nested: {
            country: { fields: ['name', 'iso2'] }
          }
        }
      });

      expect(result).toBe('league;league.country:name,iso2');
    });

    test('should build filters correctly', () => {
      const result = SportMonksSyntaxBuilder.buildFilters({
        eventTypes: [14, 15, 16],
        status: 'FT',
        season_id: 19735
      });

      expect(result).toBe('eventTypes:14,15,16;status:FT;season_id:19735');
    });

    test('should use custom separator', () => {
      const result = SportMonksSyntaxBuilder.buildIncludes(
        {
          lineups: true,
          events: true
        },
        ','
      );

      expect(result).toBe('lineups,events');
    });
  });

  describe('Integration with SDK', () => {
    test('should work with real resource methods', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: { data: [] } });
      const client = { get: mockGet };

      class TestResource extends BaseResource {
        constructor() {
          super(client as any, '/football/fixtures', ',');
        }
      }
      const resource = new TestResource();

      const builder = new QueryBuilder(resource, '/date/2024-01-15');

      await builder
        .withIncludes({
          lineups: ['player_name'],
          events: ['player_name', 'minute', 'type']
        })
        .filter('eventTypes', [14, 15])
        .perPage(10)
        .get();

      expect(mockGet).toHaveBeenCalledWith('/football/fixtures/date/2024-01-15', {
        params: {
          include: 'lineups:player_name,events:player_name,minute,type',
          filters: 'eventTypes:14,15',
          per_page: 10
        }
      });
    });
  });
});
