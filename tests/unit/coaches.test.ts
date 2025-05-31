import axios from 'axios';
import { SportMonksClient } from '../../src/client';
import { Coach, PaginatedResponse, SingleResponse } from '../../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CoachesResource', () => {
  let client: SportMonksClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      defaults: { params: {}, timeout: 30000 },
      interceptors: {
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Initialize client with test API key
    client = new SportMonksClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('all()', () => {
    it('should fetch all coaches', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [
          {
            id: 1,
            sport_id: 1,
            country_id: 462,
            nationality_id: 462,
            city_id: null,
            common_name: 'J. Mourinho',
            firstname: 'José',
            lastname: 'Mourinho',
            name: 'José Mourinho',
            display_name: 'José Mourinho',
            image_path: 'https://cdn.sportmonks.com/images/coaches/1.png',
            date_of_birth: '1963-01-26',
            gender: 'male'
          }
        ],
        pagination: {
          count: 1,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2996,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches', {
        params: {}
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support chaining with includes and filters', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [],
        pagination: {
          count: 0,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2996,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      await client.coaches
        .all()
        .include(['country', 'nationality', 'teams'])
        .orderBy('name')
        .perPage(50)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches', {
        params: {
          include: 'country;nationality;teams',
          order: 'name',
          per_page: 50
        }
      });
    });
  });

  describe('byId()', () => {
    it('should fetch a coach by ID', async () => {
      const mockResponse: SingleResponse<Coach> = {
        data: {
          id: 123,
          sport_id: 1,
          country_id: 462,
          nationality_id: 462,
          city_id: null,
          common_name: 'P. Guardiola',
          firstname: 'Pep',
          lastname: 'Guardiola',
          name: 'Pep Guardiola',
          display_name: 'Pep Guardiola',
          image_path: 'https://cdn.sportmonks.com/images/coaches/123.png',
          date_of_birth: '1971-01-18',
          gender: 'male'
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2995,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.byId(123).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/123', {
        params: {}
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support includes for single coach', async () => {
      const mockResponse: SingleResponse<Coach> = {
        data: {
          id: 123,
          sport_id: 1,
          country_id: 462,
          nationality_id: 462,
          city_id: null,
          common_name: 'P. Guardiola',
          firstname: 'Pep',
          lastname: 'Guardiola',
          name: 'Pep Guardiola',
          display_name: 'Pep Guardiola',
          image_path: null,
          date_of_birth: '1971-01-18',
          gender: 'male',
          country: {
            id: 462,
            name: 'Spain',
            official_name: 'Kingdom of Spain',
            fifa_name: 'Spain',
            iso2: 'ES',
            iso3: 'ESP',
            latitude: '40.000000',
            longitude: '-4.000000',
            borders: ['AD', 'FR', 'GI', 'PT', 'MA'],
            image_path: 'https://cdn.sportmonks.com/images/countries/es.png'
          }
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2994,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.byId(123).include(['country', 'nationality']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/123', {
        params: {
          include: 'country;nationality'
        }
      });
      expect(result.data.country).toBeDefined();
    });
  });

  describe('byCountry()', () => {
    it('should fetch coaches by country ID', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [
          {
            id: 1,
            sport_id: 1,
            country_id: 462,
            nationality_id: 462,
            city_id: null,
            common_name: 'Spanish Coach',
            firstname: 'Spanish',
            lastname: 'Coach',
            name: 'Spanish Coach',
            display_name: 'Spanish Coach',
            image_path: null,
            date_of_birth: '1970-01-01',
            gender: 'male'
          }
        ],
        pagination: {
          count: 1,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2993,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.byCountry(462).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/countries/462', {
        params: {}
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search()', () => {
    it('should search coaches by name', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [
          {
            id: 1,
            sport_id: 1,
            country_id: 462,
            nationality_id: 462,
            city_id: null,
            common_name: 'J. Mourinho',
            firstname: 'José',
            lastname: 'Mourinho',
            name: 'José Mourinho',
            display_name: 'José Mourinho',
            image_path: null,
            date_of_birth: '1963-01-26',
            gender: 'male'
          }
        ],
        pagination: {
          count: 1,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2992,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.search('mourinho').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/search/mourinho', {
        params: {}
      });
      expect(result).toEqual(mockResponse);
    });

    it('should properly encode search queries with special characters', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [],
        pagination: {
          count: 0,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2991,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const searchQuery = 'José Mourinho';
      await client.coaches.search(searchQuery).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/coaches/search/Jos%C3%A9%20Mourinho',
        { params: {} }
      );
    });
  });

  describe('latest()', () => {
    it('should fetch latest updated coaches', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [
          {
            id: 456,
            sport_id: 1,
            country_id: 32,
            nationality_id: 32,
            city_id: null,
            common_name: 'Recently Updated',
            firstname: 'Recently',
            lastname: 'Updated',
            name: 'Recently Updated',
            display_name: 'Recently Updated',
            image_path: null,
            date_of_birth: '1980-01-01',
            gender: 'male'
          }
        ],
        pagination: {
          count: 1,
          per_page: 25,
          current_page: 1,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2990,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.coaches.latest().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/latest', {
        params: {}
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support pagination for latest coaches', async () => {
      const mockResponse: PaginatedResponse<Coach> = {
        data: [],
        pagination: {
          count: 0,
          per_page: 100,
          current_page: 2,
          next_page: null,
          has_more: false
        },
        subscription: {
          meta: [],
          plans: [],
          add_ons: [],
          widgets: []
        },
        rate_limit: {
          resets_in_seconds: 3552,
          remaining: 2989,
          requested_entity: 'Coach'
        },
        timezone: 'UTC'
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      await client.coaches.latest().page(2).perPage(100).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/coaches/latest', {
        params: {
          page: 2,
          per_page: 100
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Coach not found'
          }
        },
        config: {
          url: '/football/coaches/999999'
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.coaches.byId(999999).get()).rejects.toThrow('Coach not found');
    });

    it('should handle rate limit errors', async () => {
      const errorResponse = {
        response: {
          status: 429,
          data: {
            message: 'Too Many Requests'
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.coaches.all().get()).rejects.toThrow('Rate limit exceeded');
    });
  });
});
