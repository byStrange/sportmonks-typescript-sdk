import axios, { AxiosInstance } from 'axios';
import { SportMonksError } from './errors';
import { QueryParameters, RetryOptions } from '../types/common';

/**
 * Base resource class that all resource-specific classes extend
 */
export abstract class BaseResource {
  protected client: AxiosInstance;
  protected basePath: string;
  protected includeSeparator: string;
  protected retryOptions: RetryOptions;

  constructor(
    client: AxiosInstance,
    basePath: string,
    includeSeparator: string = ';',
    retryOptions: RetryOptions = {}
  ) {
    this.client = client;
    this.basePath = basePath;
    this.includeSeparator = includeSeparator;
    this.retryOptions = {
      maxRetries: retryOptions.maxRetries || 0,
      retryDelay: retryOptions.retryDelay || 1000,
      maxRetryDelay: retryOptions.maxRetryDelay || 30000,
      retryOnRateLimit: retryOptions.retryOnRateLimit ?? true,
      retryStatusCodes: retryOptions.retryStatusCodes || [502, 503, 504]
    };
  }

  /**
   * Make a request to the API with optional retry logic
   */
  protected async request<T>(endpoint: string, params: QueryParameters = {}): Promise<T> {
    const url = `${this.basePath}${endpoint}`;
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries!; attempt++) {
      try {
        const response = await this.client.get(url, { params });

        // The API returns rate_limit and subscription info in the response body
        // No need to parse headers or enhance the response

        return response.data as T;
      } catch (error) {
        lastError = error;

        if (!this.shouldRetry(error, attempt)) {
          throw this.handleError(error, url);
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryOptions.retryDelay! * Math.pow(2, attempt),
          this.retryOptions.maxRetryDelay!
        );

        // If it's a rate limit error, use the reset time if available
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const resetIn = error.response.data?.rate_limit?.resets_in_seconds;
          if (resetIn) {
            await this.sleep(resetIn * 1000);
            continue;
          }
        }

        await this.sleep(delay);
      }
    }

    throw this.handleError(lastError, url);
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.retryOptions.maxRetries!) {
      return false;
    }

    if (!axios.isAxiosError(error)) {
      return false;
    }

    const status = error.response?.status;
    if (!status) {
      // Network errors should be retried
      return true;
    }

    // Check rate limit retry
    if (status === 429 && this.retryOptions.retryOnRateLimit) {
      return true;
    }

    // Check other status codes
    return this.retryOptions.retryStatusCodes!.includes(status);
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, url: string): SportMonksError {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data;
      const status = error.response?.status;

      // Better error messages based on status code
      let message = errorData?.message || error.message;
      if (status === 404) {
        message = errorData?.message || `Resource not found: ${url}`;
      } else if (status === 403) {
        message =
          errorData?.message || 'Access forbidden. Check your API key and subscription level.';
      } else if (status === 429) {
        const resetIn = errorData?.rate_limit?.resets_in_seconds;
        message = resetIn
          ? `Rate limit exceeded. Resets in ${resetIn} seconds.`
          : 'Rate limit exceeded. Please wait before making more requests.';
      }

      return new SportMonksError(message, status, errorData?.message, errorData?.errors);
    }

    return new SportMonksError(error.message || 'Unknown error occurred');
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
