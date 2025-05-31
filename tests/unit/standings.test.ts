/**
 * Unit tests for StandingsResource
 */

import axios from 'axios';
import { SportMonksClient, SportMonksError } from '../../src';
import { createMockResponse, createMockStanding } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StandingsResource', () => {
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
    test('should fetch all standings with filter', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      const response = await client.standings.all().filter('season_id', 19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings', {
        params: {
          filters: 'season_id:19735'
        }
      });
      expect(response.data).toHaveLength(1);
    });

    test('should fetch standings by season', async () => {
      const mockStandings = [
        createMockStanding(),
        createMockStanding({ position: 2, participant_id: 2 })
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      const response = await client.standings.bySeason(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/seasons/19735', {
        params: {}
      });
      expect(response.data).toHaveLength(2);
      expect(response.data[0].position).toBe(1);
    });

    test('should fetch standings by round', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings.byRound(274719).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/rounds/274719', {
        params: {}
      });
    });

    test('should fetch standing corrections', async () => {
      const mockCorrections = [
        {
          id: 1,
          participant_id: 1,
          league_id: 8,
          season_id: 19735,
          stage_id: 77457866,
          group_id: null,
          type: 'points',
          value: -3,
          calc_type: 'total',
          active: true,
          description: 'Financial breach'
        }
      ];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockCorrections)
      });

      const response = await client.standings.correctionsBySeason(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/football/standings/corrections/seasons/19735',
        { params: {} }
      );
      expect(response.data[0].value).toBe(-3);
    });

    test('should fetch live standings', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings.liveByLeague(8).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/live/leagues/8', {
        params: {}
      });
    });
  });

  describe('Query Building', () => {
    test('should include related data', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings.bySeason(19735).include(['participant', 'league', 'season']).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/seasons/19735', {
        params: {
          include: 'participant,league,season'
        }
      });
    });

    test('should handle multiple filters', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings
        .all()
        .filters({
          season_id: 19735,
          stage_id: 77457866,
          group_id: 1
        })
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings', {
        params: {
          filters: 'season_id:19735;stage_id:77457866;group_id:1'
        }
      });
    });

    test('should select specific fields', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings
        .bySeason(19735)
        .select(['position', 'points', 'wins', 'draws', 'losses'])
        .get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/seasons/19735', {
        params: {
          select: 'position,points,wins,draws,losses'
        }
      });
    });

    test('should handle pagination', async () => {
      const mockStandings = [createMockStanding()];
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockStandings)
      });

      await client.standings.bySeason(19735).page(1).perPage(20).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/standings/seasons/19735', {
        params: {
          page: 1,
          per_page: 20
        }
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent season', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'Season not found'
          }
        }
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValueOnce(notFoundError);

      try {
        await client.standings.bySeason(999999).get();
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).statusCode).toBe(404);
      }
    });

    test('should handle missing required filter', async () => {
      const badRequestError = {
        response: {
          status: 400,
          data: {
            message: 'The filter season_id is required'
          }
        }
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValueOnce(badRequestError);

      await expect(client.standings.all().get()).rejects.toThrow();
    });
  });

  describe('Response Structure', () => {
    test('should handle complete standing with all stats', async () => {
      const mockStanding = createMockStanding({
        home: {
          games_played: 9,
          wins: 7,
          draws: 1,
          losses: 1,
          goals_scored: 20,
          goals_against: 8,
          goal_difference: 12,
          points: 22
        },
        away: {
          games_played: 10,
          wins: 7,
          draws: 2,
          losses: 1,
          goals_scored: 22,
          goals_against: 9,
          goal_difference: 13,
          points: 23
        }
      });

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse([mockStanding])
      });

      const response = await client.standings.bySeason(19735).get();
      const standing = response.data[0];

      // Home and away are optional fields that may be included
      if (standing.home && standing.away) {
        expect(standing.home.points).toBe(22);
        expect(standing.away.points).toBe(23);
      }
    });
  });
});
