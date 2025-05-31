/**
 * Unit tests for LeaguesResource
 */

import axios from 'axios';
import { SportMonksClient, SportMonksError, LeagueType } from '../../src';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test helpers
import { createMockResponse, createMockLeague } from '../helpers/mock-data';

describe('LeaguesResource', () => {
  let client: SportMonksClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create to return our mock instance
    mockAxiosInstance = {
      get: jest.fn(),
      defaults: { params: {}, timeout: 30000 },
      interceptors: {
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    // Mock isAxiosError
    (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

    client = new SportMonksClient('test-api-key');
  });

  describe('Query Building', () => {
    test('should build complex queries with all parameters', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues
        .all()
        .include(['country', 'seasons'])
        .select(['id', 'name', 'active'])
        .filter('active', true)
        .filter('type', 'cup')
        .orderBy('-name')
        .has(['seasons'])
        .page(2)
        .limit(50)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues', {
        params: {
          include: 'country,seasons',
          select: 'id,name,active',
          filters: 'active:true;type:cup',
          order: '-name',
          has: 'seasons',
          page: 2,
          per_page: 50
        }
      });
    });

    test('should handle multiple filters with filters() method', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues
        .all()
        .filters({
          active: true,
          type: LeagueType.LEAGUE,
          country_id: 462
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues', {
        params: {
          filters: 'active:true;type:league;country_id:462'
        }
      });
    });

    test('should deduplicate includes and selects', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues
        .all()
        .include(['country', 'seasons'])
        .include(['country', 'stages']) // country should not be duplicated
        .select(['id', 'name'])
        .select(['name', 'active']) // name should not be duplicated
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues', {
        params: {
          include: 'country,seasons,stages',
          select: 'id,name,active'
        }
      });
    });
  });

  describe('Endpoint Methods', () => {
    test('should fetch league by ID', async () => {
      const mockLeague = createMockLeague();
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockLeague }
      });

      const response = await client.leagues.byId(271).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/271', { params: {} });
      expect(response.data).toEqual(mockLeague);
    });

    test('should search leagues with encoded query', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.search('Premier League').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/leagues/search/Premier%20League',
        { params: {} }
      );
    });

    test('should fetch leagues by date', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.byDate('2024-01-15').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/date/2024-01-15', {
        params: {}
      });
    });

    test('should fetch live leagues', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.live().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/live', { params: {} });
    });

    test('should fetch leagues by country', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.byCountry(462).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/countries/462', {
        params: {}
      });
    });

    test('should fetch leagues by team', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.byTeam(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/teams/1', {
        params: {}
      });
    });

    test('should fetch current leagues by team', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.currentByTeam(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues/teams/1/current', {
        params: {}
      });
    });
  });

  describe('Error Handling', () => {
    test('should throw SportMonksError with proper details', async () => {
      const apiError = {
        response: {
          status: 403,
          data: {
            message: 'Unauthorized',
            errors: { api_token: ['Invalid API token'] }
          }
        }
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(apiError);

      try {
        await client.leagues.all().get();
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).statusCode).toBe(403);
        expect((error as SportMonksError).apiMessage).toBe('Unauthorized');
        expect((error as SportMonksError).errors).toEqual({ api_token: ['Invalid API token'] });
      }
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);

      await expect(client.leagues.all().get()).rejects.toThrow('Network Error');
    });

    test('should handle 404 errors with better message', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {}
        }
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValueOnce(notFoundError);

      try {
        await client.leagues.byId(999999).get();
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toContain('Resource not found');
      }
    });

    test('should handle 429 rate limit errors', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: {}
        }
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValueOnce(rateLimitError);

      try {
        await client.leagues.all().get();
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toContain('Rate limit exceeded');
      }
    });
  });

  describe('Pagination', () => {
    test('should handle pagination parameters', async () => {
      const mockLeagues = [createMockLeague()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockLeagues)
      });

      await client.leagues.all().page(3).perPage(100).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/leagues', {
        params: {
          page: 3,
          per_page: 100
        }
      });
    });

    test('should fetch all pages with getAll()', async () => {
      // First page
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([createMockLeague()], {
          pagination: { has_more: true }
        })
      });

      // Second page
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([createMockLeague({ id: 2 })], {
          pagination: { has_more: true }
        })
      });

      // Third page (last)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([createMockLeague({ id: 3 })], {
          pagination: { has_more: false }
        })
      });

      const allLeagues = await client.leagues.all().getAll();

      expect(allLeagues).toHaveLength(3);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response Types', () => {
    test('should handle complete league response with metadata', async () => {
      const mockLeague = createMockLeague();
      const fullResponse = {
        data: mockLeague,
        pagination: {
          count: 1,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [{ plan: 'Basic', sport: 'Football', category: 'Standard' }],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3600,
          remaining: 2999,
          requested_entity: 'League'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: fullResponse });

      const response = await client.leagues.byId(8).get();

      expect(response).toEqual(fullResponse);
      expect(response.rate_limit!.remaining).toBe(2999);
      expect(response.timezone).toBe('UTC');
    });

    test('should handle response with rate limit info', async () => {
      const mockLeagues = [createMockLeague()];
      const response = createMockResponse(mockLeagues, {
        rateLimit: {
          remaining: 500,
          resets_in_seconds: 1800
        }
      });

      mockAxiosInstance.get.mockResolvedValueOnce({ data: response });

      const result = await client.leagues.all().get();

      expect(result.rate_limit).toBeDefined();
      expect(result.rate_limit!.remaining).toBe(500);
      expect(result.rate_limit!.resets_in_seconds).toBe(1800);
    });
  });
});

describe('SportMonksClient', () => {
  test('should update API key', () => {
    const client = new SportMonksClient('old-key');
    client.setApiKey('new-key');

    expect(client['client'].defaults.params!.api_token).toBe('new-key');
  });

  test('should update timeout', () => {
    const client = new SportMonksClient('test-key');
    client.setTimeout(60000);

    expect(client['client'].defaults.timeout).toBe(60000);
  });
});
