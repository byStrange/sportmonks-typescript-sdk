/**
 * Unit tests for TransfersResource
 */

import axios from 'axios';
import { SportMonksClient } from '../../src';
import { Transfer } from '../../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test helpers
import { createMockResponse } from '../helpers/mock-data';

// Helper to create mock transfer
function createMockTransfer(overrides?: Partial<Transfer>): Transfer {
  return {
    id: 1,
    sport_id: 1,
    player_id: 12345,
    type_id: 218,
    from_team_id: 1,
    to_team_id: 2,
    position_id: 26,
    detailed_position_id: 153,
    date: '2024-01-15',
    career_ended: false,
    completed: true,
    amount: 50000000,
    ...overrides
  };
}

describe('TransfersResource', () => {
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

  describe('all()', () => {
    test('should fetch all transfers', async () => {
      const mockTransfers = [createMockTransfer()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers.all().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers', { params: {} });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].amount).toBe(50000000);
    });

    test('should support includes and filters', async () => {
      const mockTransfers: Transfer[] = [];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers
        .all()
        .include(['player', 'fromteam', 'toteam'])
        .filter('completed', 1)
        .limit(50)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers', {
        params: {
          include: 'player;fromteam;toteam',
          filters: 'completed:1',
          per_page: 50
        }
      });
      expect(result.data).toEqual([]);
    });
  });

  describe('byId()', () => {
    test('should fetch a single transfer by ID', async () => {
      const mockTransfer = createMockTransfer({
        id: 123,
        player_id: 54321,
        type_id: 219,
        amount: 75000000
      });

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockTransfer }
      });

      const result = await client.transfers.byId(123).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/123', { params: {} });
      expect(result.data.id).toBe(123);
      expect(result.data.amount).toBe(75000000);
      expect(result.data.type_id).toBe(219);
    });

    test('should include relationships', async () => {
      const mockTransfer = createMockTransfer({
        id: 456,
        player: {
          id: 98765,
          sport_id: 1,
          country_id: 11,
          nationality_id: 11,
          city_id: 12345,
          position_id: 25,
          detailed_position_id: 154,
          type_id: 26,
          common_name: 'T. Player',
          firstname: 'Test',
          lastname: 'Player',
          name: 'Test Player',
          display_name: 'Test Player',
          image_path: null,
          height: 180,
          weight: 75,
          date_of_birth: '1995-01-01',
          gender: 'male'
        }
      });

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockTransfer }
      });

      const result = await client.transfers.byId(456).include(['player']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/456', {
        params: {
          include: 'player'
        }
      });
      expect(result.data.player).toBeDefined();
      expect(result.data.player?.display_name).toBe('Test Player');
    });
  });

  describe('latest()', () => {
    test('should fetch latest transfers', async () => {
      const mockTransfers = [
        createMockTransfer({
          id: 789,
          completed: false,
          amount: 30000000
        })
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers.latest().get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/latest', {
        params: {}
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].completed).toBe(false);
    });
  });

  describe('between()', () => {
    test('should fetch transfers between dates', async () => {
      const mockTransfers: Transfer[] = [];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers.between('2024-01-01', '2024-01-31').get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/transfers/between/2024-01-01/2024-01-31',
        { params: {} }
      );
      expect(result.data).toEqual([]);
    });

    test('should validate date format', () => {
      expect(() => client.transfers.between('2024/01/01', '2024/01/31')).toThrow(
        'Dates must be in YYYY-MM-DD format'
      );
      expect(() => client.transfers.between('01-01-2024', '31-01-2024')).toThrow(
        'Dates must be in YYYY-MM-DD format'
      );
    });

    test('should support filters on date range queries', async () => {
      const mockTransfers: Transfer[] = [];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      await client.transfers
        .between('2024-06-01', '2024-08-31')
        .filter('amount', '>50000000')
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/transfers/between/2024-06-01/2024-08-31',
        {
          params: {
            filters: 'amount:>50000000'
          }
        }
      );
    });
  });

  describe('byTeam()', () => {
    test('should fetch transfers by team ID', async () => {
      const mockTransfers = [
        createMockTransfer({
          id: 1001,
          from_team_id: 14,
          to_team_id: 999,
          amount: 40000000
        }),
        createMockTransfer({
          id: 1002,
          from_team_id: 888,
          to_team_id: 14,
          amount: 60000000
        })
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers.byTeam(14).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/teams/14', {
        params: {}
      });
      expect(result.data).toHaveLength(2);
      // Check that we have both incoming and outgoing transfers
      expect(result.data.some(t => t.from_team_id === 14)).toBe(true);
      expect(result.data.some(t => t.to_team_id === 14)).toBe(true);
    });
  });

  describe('byPlayer()', () => {
    test('should fetch transfers by player ID', async () => {
      const mockTransfers = [
        createMockTransfer({
          id: 2001,
          player_id: 44444,
          date: '2020-07-01',
          amount: 100000000
        }),
        createMockTransfer({
          id: 2002,
          player_id: 44444,
          date: '2023-08-15',
          amount: 150000000
        })
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      const result = await client.transfers.byPlayer(44444).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/players/44444', {
        params: {}
      });
      expect(result.data).toHaveLength(2);
      expect(result.data.every(t => t.player_id === 44444)).toBe(true);
      // Check transfers are in chronological order as expected
      expect(result.data[0].date).toBe('2020-07-01');
      expect(result.data[1].date).toBe('2023-08-15');
    });

    test('should include teams and type information', async () => {
      const mockTransfer = createMockTransfer({
        id: 3001,
        player_id: 55555,
        type_id: 218,
        amount: null,
        fromteam: {
          id: 600,
          sport_id: 1,
          country_id: 1,
          venue_id: 100,
          gender: 'male',
          name: 'Team A',
          short_code: 'TMA',
          image_path: null,
          founded: 1900,
          type: 'domestic',
          placeholder: false,
          last_played_at: null
        },
        toteam: {
          id: 700,
          sport_id: 1,
          country_id: 2,
          venue_id: 200,
          gender: 'male',
          name: 'Team B',
          short_code: 'TMB',
          image_path: null,
          founded: 1920,
          type: 'domestic',
          placeholder: false,
          last_played_at: null
        },
        type: {
          id: 218,
          name: 'Loan',
          code: 'loan-transfer',
          developer_name: 'LOAN_TRANSFER',
          model_type: 'transfer',
          stat_group: null
        }
      });

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([mockTransfer])
      });

      const result = await client.transfers
        .byPlayer(55555)
        .include(['fromteam', 'toteam', 'type'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers/players/55555', {
        params: {
          include: 'fromteam;toteam;type'
        }
      });
      expect(result.data[0].fromteam?.name).toBe('Team A');
      expect(result.data[0].toteam?.name).toBe('Team B');
      expect(result.data[0].type?.name).toBe('Loan');
    });
  });

  describe('Query Building', () => {
    test('should build complex queries with all parameters', async () => {
      const mockTransfers = [createMockTransfer()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockTransfers)
      });

      await client.transfers
        .all()
        .include(['player', 'fromteam', 'toteam', 'type'])
        .filter('completed', 1)
        .filter('type_id', 218)
        .page(2)
        .limit(100)
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/transfers', {
        params: {
          include: 'player;fromteam;toteam;type',
          filters: 'completed:1;type_id:218',
          page: 2,
          per_page: 100
        }
      });
    });
  });

  describe('error handling', () => {
    test('should handle API errors gracefully', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Transfer not found' }
        }
      };

      mockAxiosInstance.get.mockRejectedValueOnce(errorResponse);
      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true);

      await expect(client.transfers.byId(999999).get()).rejects.toThrow('Transfer not found');
    });

    test('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(client.transfers.all().get()).rejects.toThrow('Network Error');
    });
  });
});
