import axios from 'axios';
import { SportMonksClient } from '../../src';
import { createMockResponse } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TeamsResource', () => {
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
    test('should fetch all teams', async () => {
      const mockTeams = [
        { id: 1, name: 'Manchester United', country_id: 462 },
        { id: 14, name: 'Liverpool', country_id: 462 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTeams)
      });

      const response = await client.teams.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams', { params: {} });
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Manchester United');
    });

    test('should fetch team by ID', async () => {
      const mockTeam = {
        id: 1,
        name: 'Manchester United',
        short_code: 'MUN',
        country_id: 462,
        venue_id: 5,
        founded: 1878
      };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockTeam }
      });

      const response = await client.teams.byId(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/1', { params: {} });
      expect(response.data.id).toBe(1);
      expect(response.data.name).toBe('Manchester United');
      expect(response.data.founded).toBe(1878);
    });

    test('should fetch teams by country', async () => {
      const mockTeams = [
        { id: 1, name: 'Manchester United', country_id: 462 },
        { id: 14, name: 'Liverpool', country_id: 462 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTeams)
      });

      await client.teams.byCountry(462).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/countries/462', {
        params: {}
      });
    });

    test('should fetch teams by season', async () => {
      const mockTeams = [
        { id: 1, name: 'Manchester United' },
        { id: 14, name: 'Liverpool' }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTeams)
      });

      await client.teams.bySeason(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/seasons/19735', {
        params: {}
      });
    });

    test('should search teams', async () => {
      const mockTeams = [
        { id: 1, name: 'Manchester United' },
        { id: 8, name: 'Manchester City' }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTeams)
      });

      await client.teams.search('Manchester').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/search/Manchester', {
        params: {}
      });
    });
  });

  describe('Query Building with Includes', () => {
    test('should include related data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.teams.all().include(['country', 'venue', 'squad']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams', {
        params: {
          include: 'country,venue,squad'
        }
      });
    });

    test('should handle complex includes for single team', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.teams
        .byId(1)
        .include(['country', 'venue', 'squad.player', 'latest', 'coach'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/1', {
        params: {
          include: 'country,venue,squad.player,latest,coach'
        }
      });
    });

    test('should handle pagination with includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.teams.bySeason(19735).include(['country', 'venue']).page(2).perPage(20).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams/seasons/19735', {
        params: {
          include: 'country,venue',
          page: 2,
          per_page: 20
        }
      });
    });

    test('should handle filters with includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.teams.all().include(['country']).filter('national_team', 'true').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/teams', {
        params: {
          include: 'country',
          filters: 'national_team:true'
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Team not found'
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.teams.byId(99999).get()).rejects.toThrow('Team not found');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(client.teams.all().get()).rejects.toThrow('Network Error');
    });
  });
});
