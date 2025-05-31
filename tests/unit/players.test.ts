import axios from 'axios';
import { SportMonksClient } from '../../src';
import { createMockResponse } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PlayersResource', () => {
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
    test('should fetch all players', async () => {
      const mockPlayers = [
        { id: 1, display_name: 'Cristiano Ronaldo', position_id: 4 },
        { id: 2, display_name: 'Lionel Messi', position_id: 4 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockPlayers)
      });

      const response = await client.players.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players', { params: {} });
      expect(response.data).toHaveLength(2);
      expect(response.data[0].display_name).toBe('Cristiano Ronaldo');
    });

    test('should fetch player by ID', async () => {
      const mockPlayer = {
        id: 1,
        display_name: 'Cristiano Ronaldo',
        common_name: 'C. Ronaldo',
        position_id: 4,
        country_id: 32,
        date_of_birth: '1985-02-05',
        height: 187,
        weight: 83
      };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockPlayer }
      });

      const response = await client.players.byId(1).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/1', { params: {} });
      expect(response.data.id).toBe(1);
      expect(response.data.display_name).toBe('Cristiano Ronaldo');
      expect(response.data.height).toBe(187);
    });

    test('should fetch players by country', async () => {
      const mockPlayers = [
        { id: 1, display_name: 'Cristiano Ronaldo', country_id: 32 },
        { id: 2, display_name: 'Bruno Fernandes', country_id: 32 }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockPlayers)
      });

      await client.players.byCountry(32).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/countries/32', {
        params: {}
      });
    });

    test('should search players', async () => {
      const mockPlayers = [
        { id: 1, display_name: 'Cristiano Ronaldo' },
        { id: 2, display_name: 'Cristiano Biraghi' }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockPlayers)
      });

      await client.players.search('Cristiano').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/search/Cristiano', {
        params: {}
      });
    });

    test('should fetch latest players', async () => {
      const mockPlayers = [
        { id: 1, display_name: 'New Player 1' },
        { id: 2, display_name: 'New Player 2' }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockPlayers)
      });

      await client.players.latest().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/latest', {
        params: {}
      });
    });
  });

  describe('Query Building with Includes', () => {
    test('should include related data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.players.all().include(['country', 'position', 'detailedposition']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players', {
        params: {
          include: 'country,position,detailedposition'
        }
      });
    });

    test('should handle complex includes for single player', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.players
        .byId(1)
        .include(['country', 'position', 'detailedposition', 'statistics', 'transfers', 'trophies'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/1', {
        params: {
          include: 'country,position,detailedposition,statistics,transfers,trophies'
        }
      });
    });

    test('should handle nested includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: {} }
      });

      await client.players
        .byId(1)
        .include(['transfers.team', 'transfers.type', 'statistics.details'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/1', {
        params: {
          include: 'transfers.team,transfers.type,statistics.details'
        }
      });
    });

    test('should handle pagination with includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.players
        .byCountry(32)
        .include(['position', 'detailedposition'])
        .page(2)
        .perPage(50)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players/countries/32', {
        params: {
          include: 'position,detailedposition',
          page: 2,
          per_page: 50
        }
      });
    });

    test('should handle filters with includes', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([])
      });

      await client.players
        .all()
        .include(['country', 'position'])
        .filter('position_id', '4') // Forward
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/players', {
        params: {
          include: 'country,position',
          filters: 'position_id:4'
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
            message: 'Player not found'
          }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.players.byId(99999).get()).rejects.toThrow('Player not found');
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

      await expect(client.players.byId(1).include(['invalid_include']).get()).rejects.toThrow(
        "The requested include 'invalid_include' does not exist"
      );
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValueOnce(networkError);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(client.players.all().get()).rejects.toThrow('Network Error');
    });
  });
});
