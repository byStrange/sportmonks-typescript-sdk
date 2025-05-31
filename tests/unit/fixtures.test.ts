import axios from 'axios';
import { SportMonksClient } from '../../src';
import { createMockResponse } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FixturesResource', () => {
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

  describe('Endpoint Methods', () => {
    test('should fetch all fixtures', async () => {
      const mockFixtures = [
        { id: 18535517, name: 'Manchester United vs Liverpool', state_id: 5 },
        { id: 18535518, name: 'Chelsea vs Arsenal', state_id: 1 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockFixtures)
      });

      const response = await client.fixtures.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures', { params: {} });
      expect(response.data).toHaveLength(2);
    });

    test('should fetch fixture by ID', async () => {
      const mockFixture = {
        id: 18535517,
        name: 'Manchester United vs Liverpool',
        league_id: 8,
        season_id: 19735,
        venue_id: 5,
        state_id: 5
      };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockFixture }
      });

      const response = await client.fixtures.byId(18535517).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {}
      });
      expect(response.data.id).toBe(18535517);
    });

    test('should fetch fixtures by date', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures.byDate('2024-01-15').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/date/2024-01-15', {
        params: {}
      });
    });

    test('should search fixtures', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures.search('Manchester derby').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/fixtures/search/Manchester%20derby',
        { params: {} }
      );
    });

    test('should fetch fixtures by TV station', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures.upcomingByTvStation(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/fixtures/upcoming/tv-stations/1',
        { params: {} }
      );
    });
  });

  describe('Query Building with Comprehensive Includes', () => {
    test('should include basic relationships', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures.all().include(['localteam', 'visitorteam', 'venue', 'referee']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures', {
        params: {
          include: 'localteam,visitorteam,venue,referee'
        }
      });
    });

    test('should handle nested includes for teams', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures
        .byId(18535517)
        .include([
          'localteam.country',
          'visitorteam.country',
          'localteam.venue',
          'visitorteam.venue'
        ])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {
          include: 'localteam.country,visitorteam.country,localteam.venue,visitorteam.venue'
        }
      });
    });

    test('should include match details', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures
        .byId(18535517)
        .include(['events', 'lineups', 'statistics', 'comments'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {
          include: 'events,lineups,statistics,comments'
        }
      });
    });

    test('should handle complex nested includes for events', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures
        .byId(18535517)
        .include(['events.type', 'events.player', 'events.relatedplayer'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {
          include: 'events.type,events.player,events.relatedplayer'
        }
      });
    });

    test('should include lineup details', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures
        .byId(18535517)
        .include(['lineups.player', 'lineups.stats', 'bench.player', 'bench.stats'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {
          include: 'lineups.player,lineups.stats,bench.player,bench.stats'
        }
      });
    });

    test('should include league and season information', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures
        .byDate('2024-01-15')
        .include(['league', 'season', 'stage', 'round'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/date/2024-01-15', {
        params: {
          include: 'league,season,stage,round'
        }
      });
    });

    test('should handle betting-related includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.fixtures.byId(18535517).include(['odds', 'predictions', 'valuebet']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/18535517', {
        params: {
          include: 'odds,predictions,valuebet'
        }
      });
    });

    test('should combine includes with filters and pagination', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures
        .byDateRange('2024-01-01', '2024-01-31')
        .include(['localteam', 'visitorteam', 'league', 'venue'])
        .filter('status_id', '5') // Finished matches
        .filter('league_id', '8')
        .page(1)
        .perPage(50)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/fixtures/between/2024-01-01/2024-01-31',
        {
          params: {
            include: 'localteam,visitorteam,league,venue',
            filters: 'status_id:5;league_id:8',
            page: 1,
            per_page: 50
          }
        }
      );
    });

    test('should handle head-to-head with includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.fixtures
        .headToHead(1, 14)
        .include(['localteam', 'visitorteam', 'scores', 'events'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/fixtures/head-to-head/1/14', {
        params: {
          include: 'localteam,visitorteam,scores,events'
        }
      });
    });
  });

  describe('Date Validation', () => {
    test('should validate date format', () => {
      expect(() => client.fixtures.byDate('invalid-date')).toThrow(
        'Invalid date format: invalid-date. Expected YYYY-MM-DD'
      );
    });

    test('should validate date range', () => {
      expect(() => client.fixtures.byDateRange('2024-01-31', '2024-01-01')).toThrow(
        'Invalid date range: start date (2024-01-31) is after end date (2024-01-01)'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid fixture ID', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Fixture not found'
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.fixtures.byId(99999999).get()).rejects.toThrow('Fixture not found');
    });

    test('should handle invalid includes', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: "The requested include 'invalid_include' does not exist"
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(
        client.fixtures.byId(18535517).include(['invalid_include']).get()
      ).rejects.toThrow("The requested include 'invalid_include' does not exist");
    });
  });
});
