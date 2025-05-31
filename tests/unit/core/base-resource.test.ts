import axios, { AxiosError, AxiosInstance } from 'axios';
import { BaseResource } from '../../../src/core/base-resource';
import { SportMonksError } from '../../../src/core/errors';

jest.mock('axios');

// Create a concrete implementation for testing
class TestResource extends BaseResource {
  public async testRequest<T>(endpoint: string, params = {}): Promise<T> {
    return this.request<T>(endpoint, params);
  }
}

describe('BaseResource', () => {
  let mockClient: jest.Mocked<AxiosInstance>;
  let resource: TestResource;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      defaults: { params: {} }
    } as any;
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      resource = new TestResource(mockClient, '/test');
      expect(resource['basePath']).toBe('/test');
      expect(resource['includeSeparator']).toBe(';');
      expect(resource['retryOptions']).toEqual({
        maxRetries: 0,
        retryDelay: 1000,
        maxRetryDelay: 30000,
        retryOnRateLimit: true,
        retryStatusCodes: [502, 503, 504]
      });
    });

    test('should accept custom retry options', () => {
      resource = new TestResource(mockClient, '/test', ',', {
        maxRetries: 3,
        retryDelay: 2000,
        maxRetryDelay: 60000,
        retryOnRateLimit: false,
        retryStatusCodes: [500, 502]
      });

      expect(resource['includeSeparator']).toBe(',');
      expect(resource['retryOptions']).toEqual({
        maxRetries: 3,
        retryDelay: 2000,
        maxRetryDelay: 60000,
        retryOnRateLimit: false,
        retryStatusCodes: [500, 502]
      });
    });
  });

  describe('request method', () => {
    beforeEach(() => {
      resource = new TestResource(mockClient, '/test');
    });

    test('should make successful request', async () => {
      const mockData = { data: [{ id: 1 }] };
      mockClient.get.mockResolvedValueOnce({ data: mockData });

      const result = await resource.testRequest('/endpoint');

      expect(mockClient.get).toHaveBeenCalledWith('/test/endpoint', { params: {} });
      expect(result).toEqual(mockData);
    });

    test('should make request with parameters', async () => {
      const mockData = { data: [] };
      const params = { page: 1, per_page: 10 };
      mockClient.get.mockResolvedValueOnce({ data: mockData });

      await resource.testRequest('/endpoint', params);

      expect(mockClient.get).toHaveBeenCalledWith('/test/endpoint', { params });
    });

    test('should handle network errors without retry when maxRetries is 0', async () => {
      const networkError = new Error('Network error');
      mockClient.get.mockRejectedValueOnce(networkError);

      await expect(resource.testRequest('/endpoint')).rejects.toThrow(SportMonksError);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    test('should retry on network errors when configured', async () => {
      resource = new TestResource(mockClient, '/test', ';', { maxRetries: 2 });

      const networkError = {
        isAxiosError: true,
        response: undefined, // This makes it a network error
        message: 'Network error'
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await resource.testRequest('/endpoint');

      expect(mockClient.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    test('should throw SportMonksError with 404 message', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Not found' }
        },
        message: 'Request failed'
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValue(axiosError);

      try {
        await resource.testRequest('/endpoint');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).statusCode).toBe(404);
        expect((error as SportMonksError).message).toBe('Not found');
      }
    });

    test('should handle 403 forbidden errors', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {}
        },
        message: 'Forbidden'
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(axiosError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toBe(
          'Access forbidden. Check your API key and subscription level.'
        );
      }
    });

    test('should handle rate limit errors with reset time', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            rate_limit: {
              resets_in_seconds: 60
            }
          }
        },
        message: 'Rate limited'
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(axiosError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toBe(
          'Rate limit exceeded. Resets in 60 seconds.'
        );
      }
    });

    test('should handle rate limit errors without reset time', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {}
        },
        message: 'Rate limited'
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(axiosError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toBe(
          'Rate limit exceeded. Please wait before making more requests.'
        );
      }
    });

    test('should retry on rate limit when configured', async () => {
      resource = new TestResource(mockClient, '/test', ';', {
        maxRetries: 1,
        retryOnRateLimit: true,
        retryDelay: 10 // Very short delay for testing
      });

      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {}
        }
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await resource.testRequest('/endpoint');

      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    test('should not retry on rate limit when disabled', async () => {
      resource = new TestResource(mockClient, '/test', ';', {
        maxRetries: 1,
        retryOnRateLimit: false
      });

      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {}
        }
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(rateLimitError);

      await expect(resource.testRequest('/endpoint')).rejects.toThrow(SportMonksError);

      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    test('should retry on configured status codes', async () => {
      resource = new TestResource(mockClient, '/test', ';', {
        maxRetries: 1,
        retryDelay: 10,
        retryStatusCodes: [502, 503]
      });

      const serverError = {
        isAxiosError: true,
        response: {
          status: 502,
          data: { message: 'Bad Gateway' }
        }
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await resource.testRequest('/endpoint');

      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });
    });

    test('should handle multiple retries', async () => {
      resource = new TestResource(mockClient, '/test', ';', {
        maxRetries: 2,
        retryDelay: 10
      });

      const serverError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {}
        }
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await resource.testRequest('/endpoint');

      expect(mockClient.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    test('should handle non-axios errors', async () => {
      const genericError = new Error('Something went wrong');
      jest.mocked(axios.isAxiosError).mockReturnValue(false);
      mockClient.get.mockRejectedValueOnce(genericError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toBe('Something went wrong');
        expect((error as SportMonksError).statusCode).toBeUndefined();
      }
    });

    test('should handle errors with custom error data', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              field1: ['Error 1', 'Error 2'],
              field2: ['Error 3']
            }
          }
        }
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(axiosError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        const sportMonksError = error as SportMonksError;
        expect(sportMonksError.message).toBe('Validation failed');
        expect(sportMonksError.statusCode).toBe(400);
        expect(sportMonksError.errors).toEqual({
          field1: ['Error 1', 'Error 2'],
          field2: ['Error 3']
        });
      }
    });

    test('should handle errors without response', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network timeout',
        response: undefined
      } as AxiosError;

      jest.mocked(axios.isAxiosError).mockReturnValue(true);
      mockClient.get.mockRejectedValueOnce(axiosError);

      try {
        await resource.testRequest('/endpoint');
      } catch (error) {
        expect(error).toBeInstanceOf(SportMonksError);
        expect((error as SportMonksError).message).toBe('Network timeout');
      }
    });
  });
});
