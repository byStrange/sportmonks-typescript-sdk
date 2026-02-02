import axios from 'axios';
import { SportMonksClient } from '../../src';
import { createMockResponse } from '../helpers/mock-data';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SchedulesResource', () => {
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

  describe('getBySeasonId', () => {
    test('should fetch schedules by season ID', async () => {
      const mockSchedules = [
        {
          id: 1,
          name: 'Group Stage',
          rounds: [
            {
              id: 101,
              name: 'Round 1',
              fixtures: []
            }
          ]
        }
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: createMockResponse(mockSchedules)
      });

      const response = await client.schedules.getBySeasonId(19735).get();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/football/schedules/seasons/19735', {
        params: {}
      });
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe(1);
    });
  });
});
