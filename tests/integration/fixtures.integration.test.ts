import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay, getDaysAgo, getToday } from '../helpers/test-utils';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(`Rate limit: ${response.rate_limit.remaining} requests remaining`);
  }
}

describeIfApiKey('FixturesResource - Real API Integration', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTMONKS_TEST_API_KEY not found. Skipping integration tests.');
      return;
    }
    client = new SportMonksClient(API_KEY);
  });

  afterEach(async () => {
    await delay(200); // Rate limiting
  });

  test('should fetch fixtures by date', async () => {
    const yesterday = getDaysAgo(1);

    const response = await client.fixtures.byDate(yesterday).perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} fixtures for ${yesterday}`);

    if (response.data.length > 0) {
      const fixture = response.data[0];
      console.log(`\nFixture: ${fixture.name}`);
      console.log(`- Starting at: ${fixture.starting_at}`);
      console.log(`- Venue ID: ${fixture.venue_id}`);
    }

    logRateLimit(response);
  }, 20000);

  test('should fetch specific fixture', async () => {
    // Get a recent fixture first
    const twoDaysAgo = getDaysAgo(2);
    const fixtures = await client.fixtures.byDate(twoDaysAgo).perPage(1).get();

    if (fixtures.data.length === 0) {
      console.log('No fixtures found for testing');
      return;
    }

    const fixtureId = fixtures.data[0].id;
    console.log(`Testing fixture ID: ${fixtureId}`);

    const response = await client.fixtures.byId(fixtureId).get();

    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(fixtureId);

    console.log(`\nFixture details:`);
    console.log(`- Name: ${response.data.name}`);
    console.log(`- League ID: ${response.data.league_id}`);
    console.log(`- Venue ID: ${response.data.venue_id}`);

    logRateLimit(response);
  }, 20000);

  test('should fetch fixtures by date range', async () => {
    const startDate = getDaysAgo(7);
    const endDate = getToday();

    const response = await client.fixtures.byDateRange(startDate, endDate).perPage(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} fixtures between ${startDate} and ${endDate}`);

    logRateLimit(response);
  }, 20000);

  test('should test head-to-head', async () => {
    // Using well-known team IDs
    const response = await client.fixtures.headToHead(1, 14).perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} head-to-head fixtures`);

    logRateLimit(response);
  }, 20000);

  test('should search fixtures', async () => {
    const response = await client.fixtures.search('Manchester').perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} fixtures matching "Manchester"`);

    if (response.data.length > 0) {
      response.data.forEach(fixture => {
        console.log(`- ${fixture.name}`);
      });
    }

    logRateLimit(response);
  }, 20000);

  test('should test pagination', async () => {
    // Use a date that typically has many fixtures
    const fixtureDate = '2025-03-30';

    const page1 = await client.fixtures.byDate(fixtureDate).page(1).perPage(5).get();

    const page2 = await client.fixtures.byDate(fixtureDate).page(2).perPage(5).get();

    expect(page1.pagination).toBeDefined();
    expect(page1.data).toBeDefined();
    expect(Array.isArray(page1.data)).toBe(true);

    // Page 2 might have no results if there are fewer than 6 fixtures
    if (page2.data) {
      expect(page2.pagination).toBeDefined();
      console.log('Pagination info:', {
        page1Count: page1.data.length,
        page2Count: page2.data.length,
        hasMore: page2.pagination?.has_more
      });
    } else {
      console.log('Page 2 returned no results (fewer than 6 fixtures total)');
    }

    logRateLimit(page2);
  }, 20000);

  test('should test date validation', () => {
    expect(() => {
      client.fixtures.byDate('invalid-date');
    }).toThrow('Invalid date format');

    expect(() => {
      client.fixtures.byDateRange('2024-01-01', 'invalid-date');
    }).toThrow('Invalid date format');
  });

  test.skip('should fetch latest fixtures', async () => {
    // Skip: This endpoint requires a subscription plan that includes live/latest fixtures
    const response = await client.fixtures.latest().perPage(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} latest fixtures`);

    if (response.data.length > 0) {
      response.data.slice(0, 3).forEach((f: any) => {
        console.log(`- ${f.name}`);
      });
    }

    logRateLimit(response);
  }, 20000);
});
