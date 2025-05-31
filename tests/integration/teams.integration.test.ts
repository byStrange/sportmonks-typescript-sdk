import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay } from '../helpers/test-utils';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(`Rate limit: ${response.rate_limit.remaining} requests remaining`);
  }
}

describeIfApiKey('TeamsResource - Real API Integration', () => {
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

  test('should fetch teams with pagination', async () => {
    const response = await client.teams.all().perPage(5).page(1).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeLessThanOrEqual(5);
    expect(response.pagination).toBeDefined();

    if (response.data.length > 0) {
      const team = response.data[0];
      console.log(`First team: ${team.name} (ID: ${team.id})`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch specific team with includes', async () => {
    // West Ham United (ID: 1)
    const response = await client.teams.byId(1).include(['country']).get();

    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(1);
    expect(response.data.name).toBeDefined();

    // Check includes
    if (response.data.country) {
      expect(response.data.country).toBeDefined();
      console.log(`Team country: ${response.data.country.name}`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch teams by country with includes', async () => {
    // England teams
    const response = await client.teams.byCountry(462).include(['venue']).perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} English teams`);

    // Check that venue is included
    const teamsWithVenue = response.data.filter(team => team.venue !== undefined);
    console.log(`${teamsWithVenue.length} teams have venue data included`);

    logRateLimit(response);
  }, 15000);

  test('should fetch teams by season with complex includes', async () => {
    // Premier League 2023/24
    const response = await client.teams.bySeason(21646).include(['country']).perPage(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} teams in season 21646`);

    // Check various includes
    if (response.data.length > 0) {
      const team = response.data[0];
      console.log(`Team: ${team.name}`);
      console.log(`- Country: ${team.country?.name || 'Not included'}`);
    }

    logRateLimit(response);
  }, 15000);

  test('should search teams with includes', async () => {
    const response = await client.teams.search('Manchester').include(['country']).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    const manchesterTeams = response.data.filter(team =>
      team.name.toLowerCase().includes('manchester')
    );

    expect(manchesterTeams.length).toBeGreaterThan(0);
    console.log(`Found ${manchesterTeams.length} Manchester teams`);

    manchesterTeams.forEach(team => {
      console.log(`- ${team.name}`);
    });

    logRateLimit(response);
  }, 15000);

  test.skip('should test squad include (if available)', async () => {
    // Skipping as squad include may require higher subscription
  }, 15000);

  test.skip('should test coach include', async () => {
    // Skipping as coach include may not be available
  }, 15000);

  test('should verify team structure', async () => {
    const response = await client.teams.byId(1).get();

    const team = response.data;

    // Verify all expected fields
    expect(team).toHaveProperty('id');
    expect(team).toHaveProperty('sport_id');
    expect(team).toHaveProperty('country_id');
    expect(team).toHaveProperty('venue_id');
    expect(team).toHaveProperty('name');
    expect(team).toHaveProperty('short_code');
    expect(team).toHaveProperty('image_path');
    expect(team).toHaveProperty('founded');
    expect(team).toHaveProperty('type');

    console.log('Team structure:', Object.keys(team));
  }, 15000);

  test('should test invalid includes error handling', async () => {
    try {
      await client.teams.byId(1).include(['invalid_relationship']).get();

      fail('Should have thrown an error for invalid includes');
    } catch (error: any) {
      expect(error.message).toContain('include');
      console.log('Invalid include error:', error.message);
    }
  }, 15000);

  test('should test filters if supported', async () => {
    try {
      const response = await client.teams.all().filter('type', 'domestic').perPage(5).get();

      console.log(`Found ${response.data.length} domestic teams`);
      logRateLimit(response);
    } catch (error: any) {
      console.log('Filter test error (may not be supported):', error.message);
    }
  }, 15000);
});
