import axios from 'axios';
import { SportMonksClient } from '../../src/client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LivescoresResource', () => {
  let client: SportMonksClient;
  let axiosInstance: any;

  beforeEach(() => {
    axiosInstance = {
      get: jest.fn(),
      defaults: { params: {} },
      interceptors: {
        response: { use: jest.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(axiosInstance);
    client = new SportMonksClient('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('inplay()', () => {
    it('should fetch inplay fixtures', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              league_id: 8,
              season_id: 19734,
              stage_id: 77457863,
              name: 'Liverpool vs Manchester United',
              starting_at: '2024-01-15 20:00:00',
              state_id: 2, // Inplay state
              home_score: 1,
              away_score: 0
            }
          ],
          pagination: {
            count: 1,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.livescores.inplay().get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores/inplay', { params: {} });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].state_id).toBe(2);
    });

    it('should support includes for inplay fixtures', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            count: 0,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      await client.livescores.inplay().include(['league', 'participants', 'scores', 'state']).get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores/inplay', {
        params: { include: 'league,participants,scores,state' }
      });
    });
  });

  describe('all()', () => {
    it('should fetch all livescores (fixtures starting within 15 minutes)', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 2,
              league_id: 271,
              season_id: 19735,
              name: 'Barcelona vs Real Madrid',
              starting_at: '2024-01-15 20:10:00',
              state_id: 1 // Not started
            }
          ],
          pagination: {
            count: 1,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.livescores.all().get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores', { params: {} });
      expect(result.data).toHaveLength(1);
    });

    it('should support league filtering', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            count: 0,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      await client.livescores.all().filter('leagues', '8,564').get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores', {
        params: { filters: 'leagues:8,564' }
      });
    });
  });

  describe('latest()', () => {
    it('should fetch latest updated livescores', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 3,
              league_id: 384,
              season_id: 19736,
              name: 'AC Milan vs Inter Milan',
              starting_at: '2024-01-15 19:45:00',
              state_id: 2,
              last_updated_at: '2024-01-15 20:30:05'
            }
          ],
          pagination: {
            count: 1,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.livescores.latest().get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores/latest', { params: {} });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(3);
    });

    it('should support event includes', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            count: 0,
            per_page: 25,
            current_page: 1,
            next_page: null,
            has_more: false
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      await client.livescores.latest().include(['events.type', 'scores', 'participants']).get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores/latest', {
        params: { include: 'events.type,scores,participants' }
      });
    });
  });

  describe('pagination', () => {
    it('should support pagination for all endpoints', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: {
            count: 0,
            per_page: 10,
            current_page: 2,
            next_page: 3,
            has_more: true
          }
        }
      };

      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.livescores.all().page(2).perPage(10).get();

      expect(axiosInstance.get).toHaveBeenCalledWith('/football/livescores', {
        params: { page: 2, per_page: 10 }
      });
      expect(result.pagination!.current_page).toBe(2);
      expect(result.pagination!.per_page).toBe(10);
      expect(result.pagination!.has_more).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const axiosError = {
        response: {
          status: 429,
          data: {
            message: 'Too Many Requests'
          }
        },
        message: 'Request failed with status code 429'
      };

      (mockedAxios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      axiosInstance.get.mockRejectedValueOnce(axiosError);

      await expect(client.livescores.inplay().get()).rejects.toThrow(
        'Rate limit exceeded. Please wait before making more requests.'
      );
    });

    it('should handle network errors', async () => {
      axiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(client.livescores.latest().get()).rejects.toThrow('Network Error');
    });
  });
});
