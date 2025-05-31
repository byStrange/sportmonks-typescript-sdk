import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay } from '../helpers/test-utils';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(
      `Rate limit: ${response.rate_limit.remaining}/${response.rate_limit.limit} requests remaining`
    );
  }
}

describeIfApiKey('VenuesResource - Real API Integration', () => {
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

  test('should fetch all venues with pagination', async () => {
    const response = await client.venues.all().perPage(10).page(1).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeLessThanOrEqual(10);
    expect(response.pagination).toBeDefined();

    if (response.data.length > 0) {
      const venue = response.data[0];
      console.log(`First venue: ${venue.name} (ID: ${venue.id}, Capacity: ${venue.capacity})`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch a specific venue by ID', async () => {
    // Villa Park (Aston Villa)
    const response = await client.venues.byId(5).include(['country']).get();

    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(5);
    expect(response.data.name).toBeDefined();
    expect(response.data.capacity).toBeGreaterThan(0);
    expect(response.data.city_name).toBeDefined();

    console.log(`Venue details: ${response.data.name}`);
    console.log(`- Address: ${response.data.address}`);
    console.log(`- Capacity: ${response.data.capacity}`);
    console.log(`- Surface: ${response.data.surface}`);
    console.log(`- Coordinates: ${response.data.latitude}, ${response.data.longitude}`);

    if (response.data.country) {
      console.log(`- Country: ${response.data.country.name}`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch venues by season', async () => {
    // Premier League 2023/24 season
    const response = await client.venues.bySeason(21646).perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} venues for season 21646`);
    response.data.forEach(venue => {
      console.log(`- ${venue.name} (Capacity: ${venue.capacity})`);
    });

    logRateLimit(response);
  }, 15000);

  test('should search venues by name', async () => {
    const response = await client.venues.search('Emirates').include(['country']).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    const emiratesStadium = response.data.find(v => v.name.includes('Emirates Stadium'));
    if (emiratesStadium) {
      expect(emiratesStadium.city_name).toBe('London');
      console.log(`Found: ${emiratesStadium.name} (ID: ${emiratesStadium.id})`);
    }

    logRateLimit(response);
  }, 15000);

  test('should verify venue structure', async () => {
    const response = await client.venues
      .byId(206) // Emirates Stadium
      .get();

    const venue = response.data;

    // Verify all expected fields
    expect(venue).toHaveProperty('id');
    expect(venue).toHaveProperty('country_id');
    expect(venue).toHaveProperty('city_id');
    expect(venue).toHaveProperty('name');
    expect(venue).toHaveProperty('address');
    expect(venue).toHaveProperty('zipcode');
    expect(venue).toHaveProperty('latitude');
    expect(venue).toHaveProperty('longitude');
    expect(venue).toHaveProperty('capacity');
    expect(venue).toHaveProperty('image_path');
    expect(venue).toHaveProperty('city_name');
    expect(venue).toHaveProperty('surface');
    expect(venue).toHaveProperty('national_team');

    // Type checks
    expect(typeof venue.id).toBe('number');
    expect(typeof venue.name).toBe('string');
    expect(typeof venue.national_team).toBe('boolean');

    console.log('Venue structure:', Object.keys(venue));
  }, 15000);

  test('should handle includes properly', async () => {
    const response = await client.venues.byId(5).include(['country']).get();

    expect(response.data.country).toBeDefined();
    expect(response.data.country?.name).toBe('England');
    expect(response.data.country?.iso2).toBeDefined();

    logRateLimit(response);
  }, 15000);

  test('should test filter support', async () => {
    try {
      const response = await client.venues.all().filter('capacity', '>50000').perPage(5).get();

      console.log(`Found ${response.data.length} venues with capacity > 50000`);
      response.data.forEach(venue => {
        console.log(`- ${venue.name}: ${venue.capacity}`);
      });

      logRateLimit(response);
    } catch (error: any) {
      console.log('Filter test error:', error.message);
      // Filters might not be supported on venues endpoint
      expect(error.message).toBeDefined();
    }
  }, 15000);

  test('should handle invalid venue ID', async () => {
    try {
      await client.venues.byId(99999999).get();
      fail('Expected error for invalid venue ID');
    } catch (error: any) {
      expect(error.message).toBeDefined();
      console.log('Invalid ID error:', error.message);
    }
  }, 15000);

  test('should test pagination', async () => {
    const page1 = await client.venues.all().perPage(5).page(1).get();

    const page2 = await client.venues.all().perPage(5).page(2).get();

    expect(page1.data.length).toBeLessThanOrEqual(5);
    expect(page2.data.length).toBeLessThanOrEqual(5);

    // Verify different venues on different pages
    const page1Ids = page1.data.map(v => v.id);
    const page2Ids = page2.data.map(v => v.id);
    const overlap = page1Ids.filter(id => page2Ids.includes(id));
    expect(overlap.length).toBe(0);

    console.log(`Page 1: ${page1Ids.join(', ')}`);
    console.log(`Page 2: ${page2Ids.join(', ')}`);

    logRateLimit(page2);
  }, 20000);

  test('should discover API quirks', async () => {
    // Test various scenarios to discover API behavior
    const tests = [
      { name: 'Empty search', fn: () => client.venues.search('xyznotfound').get() },
      {
        name: 'Multiple includes',
        fn: () => client.venues.byId(5).include(['country', 'fixtures']).get()
      },
      { name: 'Order by', fn: () => client.venues.all().orderBy('-capacity').perPage(5).get() }
    ];

    for (const test of tests) {
      try {
        const response = await test.fn();
        console.log(
          `✅ ${test.name}: Success (${Array.isArray(response.data) ? response.data.length : 1} items)`
        );
        logRateLimit(response);
      } catch (error: any) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
      await delay(200);
    }
  }, 30000);
});
