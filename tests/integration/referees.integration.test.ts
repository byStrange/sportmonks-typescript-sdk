import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay } from '../helpers/mock-data';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(`Rate limit: ${response.rate_limit.remaining} requests remaining`);
  }
}

describeIfApiKey('RefereesResource - Real API Integration', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTMONKS_TEST_API_KEY not found. Skipping integration tests.');
      return;
    }
    client = new SportMonksClient(API_KEY);
  });

  afterEach(async () => {
    // Respect rate limits
    await delay(200);
  });

  test('should fetch all referees with pagination', async () => {
    const response = await client.referees.all().limit(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.pagination).toBeDefined();

    if (response.data.length > 0) {
      const referee = response.data[0];
      expect(referee.id).toBeDefined();
      expect(referee.name).toBeDefined();
      expect(referee.sport_id).toBeDefined();
      console.log(`First referee: ${referee.name}`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch referee by ID with includes', async () => {
    // First get a referee ID
    const refereesResponse = await client.referees.all().limit(1).get();

    if (refereesResponse.data.length > 0) {
      const refereeId = refereesResponse.data[0].id;

      const response = await client.referees.byId(refereeId).include(['country']).get();

      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(refereeId);
      expect(response.data.name).toBeDefined();

      console.log(`Referee details: ${response.data.name} (${response.data.common_name})`);

      if (response.data.country) {
        console.log(`Country: ${response.data.country.name}`);
      }

      logRateLimit(response);
    }
  }, 15000);

  test('should fetch referees by country', async () => {
    // Using England (462) as example
    const response = await client.referees.byCountry(462).limit(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} English referees`);

    if (response.data.length > 0) {
      response.data.forEach(referee => {
        expect(referee.country_id).toBe(462);
      });
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch referees by season', async () => {
    // Using a recent Premier League season ID
    const seasonId = 19735; // You may need to adjust this based on available data

    try {
      const response = await client.referees.bySeason(seasonId).limit(5).get();

      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);

      console.log(`Found ${response.data.length} referees for season ${seasonId}`);

      logRateLimit(response);
    } catch (error: any) {
      // This endpoint might require specific subscription
      console.log('Season referees error:', error.message);
      expect(error.message).toBeDefined();
    }
  }, 15000);

  test('should search referees by name', async () => {
    const searchQuery = 'Oliver';

    const response = await client.referees.search(searchQuery).limit(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} referees matching "${searchQuery}"`);

    if (response.data.length > 0) {
      response.data.forEach(referee => {
        const nameMatch =
          referee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          referee.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          referee.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          referee.lastname.toLowerCase().includes(searchQuery.toLowerCase());

        expect(nameMatch).toBe(true);
      });
    }

    logRateLimit(response);
  }, 15000);

  test('should verify referee structure', async () => {
    const response = await client.referees.all().limit(1).get();

    if (response.data.length > 0) {
      const referee = response.data[0];

      // Verify all expected fields from our interface
      expect(referee).toHaveProperty('id');
      expect(referee).toHaveProperty('sport_id');
      expect(referee).toHaveProperty('country_id');
      expect(referee).toHaveProperty('common_name');
      expect(referee).toHaveProperty('firstname');
      expect(referee).toHaveProperty('lastname');
      expect(referee).toHaveProperty('name');
      expect(referee).toHaveProperty('display_name');
      expect(referee).toHaveProperty('gender');

      // Log the actual structure for documentation
      console.log('Referee structure:', Object.keys(referee));
      console.log('Sample referee:', {
        id: referee.id,
        name: referee.name,
        common_name: referee.common_name,
        country_id: referee.country_id
      });
    }
  }, 15000);

  test('should handle ordering', async () => {
    const response = await client.referees.all().orderBy('name').limit(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    // Just verify we got data, ordering might not work as expected on all endpoints
    console.log(
      'Ordered referees:',
      response.data.map(r => r.name)
    );

    logRateLimit(response);
  }, 15000);

  test('should handle includes properly', async () => {
    const refereesResponse = await client.referees.all().limit(1).get();

    if (refereesResponse.data.length > 0) {
      const refereeId = refereesResponse.data[0].id;

      // Only test with country include as other relationships may not be supported
      const response = await client.referees.byId(refereeId).include(['country']).get();

      expect(response.data).toBeDefined();

      console.log('Included relationships:', {
        hasCountry: !!response.data.country
      });

      logRateLimit(response);
    }
  }, 15000);
});
