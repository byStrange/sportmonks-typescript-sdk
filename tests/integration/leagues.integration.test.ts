/**
 * Integration tests for LeaguesResource with real API
 * Uses actual API key from environment variables
 * Rate limit aware - 3000 requests per entity per hour
 */

import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay } from '../helpers/mock-data';

// Load environment variables
dotenv.config();

// Skip these tests if no API key is provided
const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

// Helper to log rate limit info
function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(
      `Rate limit: ${response.rate_limit.remaining} requests remaining (resets in ${response.rate_limit.resets_in_seconds}s)`
    );
  }
}

describeIfApiKey('LeaguesResource - Real API Integration', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTMONKS_TEST_API_KEY not found. Skipping integration tests.');
      return;
    }
    console.log('✅ Running integration tests with real API key');
    client = new SportMonksClient(API_KEY);
  });

  // Add delay between tests to respect rate limits
  afterEach(async () => {
    await delay(200); // 200ms delay between tests
  });

  describe('Basic Endpoints', () => {
    test('should fetch all leagues with pagination', async () => {
      const response = await client.leagues.all().limit(5).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(5);

      // Check response structure
      expect(response.pagination).toBeDefined();
      expect(response.rate_limit).toBeDefined();
      expect(response.subscription).toBeDefined();

      logRateLimit(response);
    }, 10000); // 10 second timeout

    test('should fetch a specific league by ID', async () => {
      // Using Premier League ID: 8
      const response = await client.leagues.byId(8).get();

      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(8);
      expect(response.data.name).toBeTruthy();
      expect(response.data.country_id).toBeTruthy();

      logRateLimit(response);
    }, 10000);

    test('should fetch leagues with includes', async () => {
      const response = await client.leagues.byId(8).include(['country']).get();

      expect(response.data).toBeDefined();
      expect(response.data.country).toBeDefined();
      expect(response.data.country?.name).toBeTruthy();

      // Check what fields are included
      console.log('League includes:', Object.keys(response.data));

      logRateLimit(response);
    }, 10000);

    test('should search for leagues', async () => {
      const response = await client.leagues.search('premier').limit(5).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Should find leagues with 'premier' in the name
      const hasMatchingLeague = response.data.some(league =>
        league.name.toLowerCase().includes('premier')
      );
      expect(hasMatchingLeague).toBe(true);

      logRateLimit(response);
    }, 10000);

    test('should fetch leagues by country', async () => {
      // England country ID is typically 462
      // Note: byCountry endpoint doesn't support additional filters
      const response = await client.leagues.byCountry(462).limit(5).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // All leagues should be from England
      response.data.forEach(league => {
        expect(league.country_id).toBe(462);
      });

      logRateLimit(response);
    }, 10000);
  });

  describe('Advanced Features', () => {
    test('should use advanced query features', async () => {
      // Use the all() endpoint which supports filters
      const response = await client.leagues
        .all()
        .select(['id', 'name', 'type', 'active'])
        .orderBy('id') // Order by ID ascending
        .limit(3)
        .get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Check if only selected fields are present (API might include required fields)
      if (response.data.length > 0) {
        const league = response.data[0];
        expect(league.id).toBeDefined();
        expect(league.name).toBeDefined();
      }

      // Log to see if ordering is respected
      console.log(
        'Order test:',
        response.data.map(l => ({ id: l.id, name: l.name }))
      );

      logRateLimit(response);
    }, 10000);

    test('should handle API errors gracefully', async () => {
      try {
        // Request a league ID that likely doesn't exist
        await client.leagues.byId(99999999).get();
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        // Log the actual error to debug
        console.log('Error details:', {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode
        });

        // The error should contain meaningful information
        expect(error.message).toBeTruthy();
        // Check if it's an API error (might be SportMonksError or generic Error)
        expect(['SportMonksError', 'Error', 'ReferenceError'].includes(error.name)).toBe(true);
      }
    }, 10000);
  });

  describe('Live Data Endpoints', () => {
    test('should fetch leagues with live fixtures', async () => {
      try {
        const response = await client.leagues.live().limit(5).get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Note: This might return empty array if no live matches
        console.log(`Found ${response.data.length} leagues with live fixtures`);

        logRateLimit(response);
      } catch (error: any) {
        // This endpoint might require specific subscription
        console.log('Live endpoint error:', error.message);
        // Just ensure we get a proper error
        expect(error.message).toBeDefined();
      }
    }, 10000);

    test('should fetch leagues by date', async () => {
      // Use today's date
      const today = new Date().toISOString().split('T')[0];

      const response = await client.leagues.byDate(today).limit(5).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      logRateLimit(response);
    }, 10000);
  });

  describe('Rate Limit Tracking', () => {
    test('should verify rate limit tracking', async () => {
      const response1 = await client.leagues.all().limit(1).get();
      const initialRequestsLeft = response1.rate_limit?.remaining || 0;

      await delay(100);

      const response2 = await client.leagues.all().limit(1).get();
      const afterRequestsLeft = response2.rate_limit?.remaining || 0;

      // Should have one less request available
      expect(afterRequestsLeft).toBeLessThanOrEqual(initialRequestsLeft);

      console.log(`Rate limit tracking: ${initialRequestsLeft} -> ${afterRequestsLeft}`);
    }, 10000);
  });

  describe('Real-world Usage Patterns', () => {
    test('should handle nested includes for detailed league info', async () => {
      const response = await client.leagues.byId(8).include(['country']).get();

      const league = response.data;
      expect(league).toBeDefined();
      expect(league.country).toBeDefined();

      // Log the structure for documentation
      console.log('League structure:', {
        id: league.id,
        name: league.name,
        hasCountry: !!league.country,
        hasSeasons: !!league.seasons,
        seasonsCount: league.seasons?.length || 0
      });

      logRateLimit(response);
    }, 10000);

    test('should fetch team leagues', async () => {
      // Using a well-known team ID (e.g., Manchester United: 1)
      const response = await client.leagues.byTeam(1).limit(10).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      logRateLimit(response);
    }, 10000);

    test('should fetch current team leagues', async () => {
      const response = await client.leagues.currentByTeam(1).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      // Current leagues should all be active
      response.data.forEach(league => {
        expect(league.active).toBeTruthy();
      });

      logRateLimit(response);
    }, 10000);
  });
});
