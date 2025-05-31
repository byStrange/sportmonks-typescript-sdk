import axios from 'axios';
import { SportMonksClient, SportMonksError } from '../../src';
import { createMockResponse } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VenuesResource', () => {
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
    test('should fetch all venues', async () => {
      const mockVenues = [
        { id: 5, name: 'Old Trafford', capacity: 74310, city_name: 'Manchester' },
        { id: 206, name: 'Emirates Stadium', capacity: 60704, city_name: 'London' }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockVenues)
      });

      const response = await client.venues.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues', { params: {} });
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Old Trafford');
    });

    test('should fetch venue by ID', async () => {
      const mockVenue = {
        id: 5,
        name: 'Old Trafford',
        capacity: 74310,
        address: 'Sir Matt Busby Way',
        city_name: 'Manchester',
        surface: 'grass'
      };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockVenue }
      });

      const response = await client.venues.byId(5).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues/5', { params: {} });
      expect(response.data.id).toBe(5);
      expect(response.data.name).toBe('Old Trafford');
      expect(response.data.surface).toBe('grass');
    });

    test('should fetch venues by season', async () => {
      const mockVenues = [
        { id: 5, name: 'Old Trafford', capacity: 74310 },
        { id: 206, name: 'Emirates Stadium', capacity: 60704 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockVenues)
      });

      await client.venues.bySeason(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues/seasons/19735', {
        params: {}
      });
    });

    test('should search venues', async () => {
      const mockVenues = [{ id: 5, name: 'Old Trafford', capacity: 74310 }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockVenues)
      });

      await client.venues.search('Old Trafford').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues/search/Old%20Trafford', {
        params: {}
      });
    });

    test('should throw error for short search query', () => {
      expect(() => client.venues.search('OT')).toThrow(
        'Search query must be at least 3 characters long'
      );
    });

    test('should handle special characters in search', async () => {
      const mockVenues = [{ id: 123, name: "St. James' Park", capacity: 52305 }];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockVenues)
      });

      await client.venues.search("St. James' Park").get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/football/venues/search/St.%20James'%20Park",
        { params: {} }
      );
    });
  });

  describe('Query Building', () => {
    test('should include related data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.venues.all().include(['country']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues', {
        params: {
          include: 'country'
        }
      });
    });

    test('should handle pagination', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.venues.all().page(2).perPage(25).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues', {
        params: {
          page: 2,
          per_page: 25
        }
      });
    });

    test('should handle filters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.venues.all().filter('capacity', '>50000').filter('surface', 'grass').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues', {
        params: {
          filters: 'capacity:>50000;surface:grass'
        }
      });
    });

    test('should combine all query parameters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.venues
        .bySeason(19735)
        .include(['country'])
        .filter('capacity', '>40000')
        .orderBy('-capacity')
        .page(1)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/venues/seasons/19735', {
        params: {
          include: 'country',
          filters: 'capacity:>40000',
          order: '-capacity',
          page: 1
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle SportMonks API errors', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Invalid venue ID provided'
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.venues.byId(99999).get()).rejects.toThrow(
        new SportMonksError('Invalid venue ID provided')
      );
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(client.venues.all().get()).rejects.toThrow('Network Error');
    });
  });
});
