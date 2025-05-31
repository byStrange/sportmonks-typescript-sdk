import { Poller, createLivescoresPoller, createTransfersPoller } from '../../../src/utils/polling';
import { PaginatedResponse } from '../../../src/types';

describe('Polling Utilities', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Poller', () => {
    let fetchFunction: jest.Mock;
    let onData: jest.Mock;
    let onError: jest.Mock;

    beforeEach(() => {
      fetchFunction = jest.fn();
      onData = jest.fn();
      onError = jest.fn();
    });

    test('should start polling and fetch immediately', () => {
      fetchFunction.mockResolvedValue({ data: 'test' });

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      expect(fetchFunction).toHaveBeenCalledTimes(1);
      expect(poller.isActive()).toBe(true);
    });

    test('should poll at specified interval', async () => {
      fetchFunction.mockResolvedValue({ data: 'test' });

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      // Initial call
      expect(fetchFunction).toHaveBeenCalledTimes(1);

      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);
      expect(fetchFunction).toHaveBeenCalledTimes(2);

      // Advance timer by another second
      jest.advanceTimersByTime(1000);
      expect(fetchFunction).toHaveBeenCalledTimes(3);

      poller.stop();
    });

    test('should stop polling after max duration', async () => {
      fetchFunction.mockResolvedValue({ data: 'test' });

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        maxDuration: 3000,
        onData
      });

      poller.start();

      // Advance timer past max duration
      jest.advanceTimersByTime(4000);

      expect(poller.isActive()).toBe(false);
    });

    test('should throw error if already polling', () => {
      const poller = new Poller(fetchFunction, {
        interval: 1000
      });

      poller.start();

      expect(() => poller.start()).toThrow('Polling is already active');

      poller.stop();
    });

    test('should call onData when data changes', async () => {
      fetchFunction
        .mockResolvedValueOnce({ data: 'test1' })
        .mockResolvedValueOnce({ data: 'test2' });

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      // Wait for initial fetch
      await Promise.resolve();
      expect(onData).toHaveBeenCalledWith({ data: 'test1' });

      // Advance timer
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(onData).toHaveBeenCalledTimes(2);
      expect(onData).toHaveBeenLastCalledWith({ data: 'test2' });

      poller.stop();
    });

    test('should handle errors with onError callback', async () => {
      const error = new Error('Fetch failed');
      fetchFunction.mockRejectedValue(error);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onError,
        stopOnError: false
      });

      poller.start();

      // Wait for fetch to complete
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(error);
      expect(poller.isActive()).toBe(true);

      poller.stop();
    });

    test('should stop on error if stopOnError is true', async () => {
      fetchFunction.mockRejectedValue(new Error('Fetch failed'));

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onError,
        stopOnError: true
      });

      poller.start();

      // Wait for fetch to complete
      await Promise.resolve();

      expect(onError).toHaveBeenCalled();
      expect(poller.isActive()).toBe(false);
    });

    test('should use custom compare function', async () => {
      const data1 = { id: 1, value: 'test' };
      const data2 = { id: 1, value: 'updated' };

      fetchFunction.mockResolvedValueOnce(data1).mockResolvedValueOnce(data2);

      const compareFunction = jest.fn((oldData, newData) => oldData.value !== newData.value);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData,
        compareFunction
      });

      poller.start();

      await Promise.resolve();
      expect(onData).toHaveBeenCalledWith(data1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(compareFunction).toHaveBeenCalledWith(data1, data2);
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    test('should handle paginated response comparison', async () => {
      const response1: PaginatedResponse<any> = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          count: 2,
          per_page: 10,
          current_page: 1,
          next_page: null,
          has_more: false
        }
      };

      const response2: PaginatedResponse<any> = {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: {
          count: 3,
          per_page: 10,
          current_page: 1,
          next_page: null,
          has_more: false
        }
      };

      fetchFunction.mockResolvedValueOnce(response1).mockResolvedValueOnce(response2);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      await Promise.resolve();
      expect(onData).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should detect new item
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    test('should detect removed items in paginated response', async () => {
      const response1: PaginatedResponse<any> = {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: {
          count: 3,
          per_page: 10,
          current_page: 1,
          next_page: null,
          has_more: false
        }
      };

      const response2: PaginatedResponse<any> = {
        data: [{ id: 1 }, { id: 3 }],
        pagination: {
          count: 2,
          per_page: 10,
          current_page: 1,
          next_page: null,
          has_more: false
        }
      };

      fetchFunction.mockResolvedValueOnce(response1).mockResolvedValueOnce(response2);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should detect removed item
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    test('should not trigger onData if paginated data unchanged', async () => {
      const response: PaginatedResponse<any> = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          count: 2,
          per_page: 10,
          current_page: 1,
          next_page: null,
          has_more: false
        }
      };

      fetchFunction.mockResolvedValue(response);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      await Promise.resolve();
      expect(onData).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      // Should not call onData again
      expect(onData).toHaveBeenCalledTimes(1);

      poller.stop();
    });

    test('should use JSON comparison for non-paginated responses', async () => {
      const data1 = { value: 'test', count: 1 };
      const data2 = { value: 'test', count: 2 };

      fetchFunction.mockResolvedValueOnce(data1).mockResolvedValueOnce(data2);

      const poller = new Poller(fetchFunction, {
        interval: 1000,
        onData
      });

      poller.start();

      await Promise.resolve();
      expect(onData).toHaveBeenCalledWith(data1);

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(onData).toHaveBeenCalledWith(data2);
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    test('should properly clean up on stop', () => {
      const poller = new Poller(fetchFunction, {
        interval: 1000
      });

      poller.start();
      expect(poller.isActive()).toBe(true);

      poller.stop();
      expect(poller.isActive()).toBe(false);

      // Should not make more calls after stop
      fetchFunction.mockClear();
      jest.advanceTimersByTime(5000);
      expect(fetchFunction).not.toHaveBeenCalled();
    });
  });

  describe('createLivescoresPoller', () => {
    test('should create poller with default options', () => {
      const fetchFunction = jest.fn();
      const poller = createLivescoresPoller(fetchFunction);

      expect(poller).toBeInstanceOf(Poller);
      expect(poller.isActive()).toBe(false);
    });

    test('should merge custom options', () => {
      const fetchFunction = jest.fn().mockResolvedValue({ data: [] });
      const onData = jest.fn();

      const poller = createLivescoresPoller(fetchFunction, {
        interval: 5000,
        onData
      });

      poller.start();

      // Should use custom interval
      jest.advanceTimersByTime(5000);
      expect(fetchFunction).toHaveBeenCalledTimes(2);

      poller.stop();
    });
  });

  describe('createTransfersPoller', () => {
    test('should create poller with transfer-specific compare function', async () => {
      const fetchFunction = jest.fn();
      const onData = jest.fn();

      const oldTransfers = {
        data: [
          { id: 1, date: '2024-01-01T10:00:00Z' },
          { id: 2, date: '2024-01-02T10:00:00Z' }
        ]
      };

      const newTransfers = {
        data: [
          { id: 1, date: '2024-01-01T10:00:00Z' },
          { id: 2, date: '2024-01-02T10:00:00Z' },
          { id: 3, date: '2024-01-03T10:00:00Z' } // New transfer
        ]
      };

      fetchFunction.mockResolvedValueOnce(oldTransfers).mockResolvedValueOnce(newTransfers);

      const poller = createTransfersPoller(fetchFunction, { onData });

      poller.start();

      await Promise.resolve();
      expect(onData).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(60000); // 1 minute default
      await Promise.resolve();

      // Should detect new transfer by date
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });

    test('should handle empty transfer data', async () => {
      const fetchFunction = jest.fn();
      const onData = jest.fn();

      fetchFunction
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [{ id: 1, date: '2024-01-01T10:00:00Z' }] });

      const poller = createTransfersPoller(fetchFunction, { onData });

      poller.start();

      await Promise.resolve();
      jest.advanceTimersByTime(60000);
      await Promise.resolve();

      // Should trigger onData for both (empty to non-empty is a change)
      expect(onData).toHaveBeenCalledTimes(2);

      poller.stop();
    });
  });
});
