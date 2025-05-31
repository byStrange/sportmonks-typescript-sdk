import axios from 'axios';
import { SportMonksClient, SportMonksError } from '../../src';
import { createMockResponse, createMockReferee } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RefereesResource', () => {
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
    test('should fetch all referees', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      const response = await client.referees.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees', { params: {} });
      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('Michael Oliver');
    });

    test('should fetch referee by ID', async () => {
      const mockReferee = createMockReferee();
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockReferee }
      });

      const response = await client.referees.byId(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees/1', { params: {} });
      expect(response.data.name).toBe('Michael Oliver');
    });

    test('should fetch referees by country', async () => {
      const mockReferees = [
        createMockReferee({ id: 1, name: 'Michael Oliver' }),
        createMockReferee({ id: 2, name: 'Anthony Taylor' })
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      const response = await client.referees.byCountry(462).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees/countries/462', {
        params: {}
      });
      expect(response.data).toHaveLength(2);
    });

    test('should fetch referees by season', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      const response = await client.referees.bySeason(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees/seasons/19735', {
        params: {}
      });
      expect(response.data).toHaveLength(1);
    });

    test('should search referees', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      const response = await client.referees.search('Michael Oliver').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/referees/search/Michael%20Oliver',
        { params: {} }
      );
      expect(response.data).toHaveLength(1);
    });

    test('should throw error for short search query', () => {
      expect(() => client.referees.search('Mi')).toThrow(
        'Search query must be at least 3 characters long'
      );
    });
  });

  describe('Query Building', () => {
    test('should include related data', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees.all().include(['country', 'fixtures']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees', {
        params: {
          include: 'country,fixtures'
        }
      });
    });

    test('should handle pagination', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees.all().page(2).limit(50).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees', {
        params: {
          page: 2,
          per_page: 50
        }
      });
    });

    test('should handle filters', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees.all().filter('gender', 'male').filter('has_statistics', true).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees', {
        params: {
          filters: 'gender:male;has_statistics:true'
        }
      });
    });

    test('should handle combined query parameters', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees
        .byCountry(462)
        .include(['country'])
        .orderBy('name')
        .page(1)
        .limit(25)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees/countries/462', {
        params: {
          include: 'country',
          order: 'name',
          page: 1,
          per_page: 25
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Resource not found'
          }
        }
      };
      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(client.referees.byId(99999).get()).rejects.toThrow(SportMonksError);
    });

    test('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.referees.all().get()).rejects.toThrow('Network error');
    });
  });

  describe('URL Encoding', () => {
    test('should properly encode search queries', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees.search('Mike Dean').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/referees/search/Mike%20Dean', {
        params: {}
      });
    });

    test('should handle special characters in search', async () => {
      const mockReferees = [createMockReferee()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockReferees)
      });

      await client.referees.search("O'Neill").get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/football/referees/search/O'Neill", {
        params: {}
      });
    });
  });
});
