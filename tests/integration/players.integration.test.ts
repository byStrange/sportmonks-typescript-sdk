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

describeIfApiKey('PlayersResource - Real API Integration', () => {
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

  test('should fetch players with pagination', async () => {
    const response = await client.players.all().perPage(5).page(1).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeLessThanOrEqual(5);
    expect(response.pagination).toBeDefined();

    if (response.data.length > 0) {
      const player = response.data[0];
      console.log(`First player: ${player.display_name} (ID: ${player.id})`);
    }

    logRateLimit(response);
  }, 15000);

  test('should fetch specific player', async () => {
    // Get a known player ID
    const players = await client.players.all().perPage(1).get();
    if (players.data.length === 0) {
      console.log('No players found');
      return;
    }

    const playerId = players.data[0].id;
    const response = await client.players.byId(playerId).get();

    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(playerId);
    expect(response.data.display_name).toBeDefined();

    console.log(`Player: ${response.data.display_name}`);
    console.log(`- Date of birth: ${response.data.date_of_birth}`);
    console.log(`- Height: ${response.data.height}`);

    logRateLimit(response);
  }, 15000);

  test('should fetch players by country', async () => {
    // Brazil (ID: 48)
    const response = await client.players.byCountry(48).perPage(5).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} Brazilian players`);

    if (response.data.length > 0) {
      response.data.forEach(player => {
        console.log(`- ${player.display_name}`);
      });
    }

    logRateLimit(response);
  }, 15000);

  test('should search players', async () => {
    const response = await client.players.search('Ronaldo').perPage(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    const ronaldoPlayers = response.data.filter(player =>
      player.display_name.toLowerCase().includes('ronaldo')
    );

    console.log(`Found ${ronaldoPlayers.length} players with "Ronaldo" in name`);

    ronaldoPlayers.forEach(player => {
      console.log(`- ${player.display_name} (ID: ${player.id})`);
    });

    logRateLimit(response);
  }, 15000);

  test('should fetch latest players', async () => {
    const response = await client.players.latest().perPage(10).get();

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    console.log(`Found ${response.data.length} recently updated players`);

    if (response.data.length > 0) {
      console.log('Latest players:');
      response.data.slice(0, 5).forEach(player => {
        console.log(`- ${player.display_name}`);
      });
    }

    logRateLimit(response);
  }, 15000);

  test('should test pagination parameters', async () => {
    const page1 = await client.players
      .byCountry(462) // England
      .page(1)
      .perPage(5)
      .get();

    const page2 = await client.players.byCountry(462).page(2).perPage(5).get();

    expect(page1.pagination).toBeDefined();
    expect(page2.pagination).toBeDefined();

    console.log('Pagination test:', {
      page1Count: page1.data.length,
      page2Count: page2.data.length,
      totalCount: page1.pagination?.count,
      hasMore: page2.pagination?.has_more
    });

    logRateLimit(page2);
  }, 15000);

  test('should validate player IDs', () => {
    expect(() => {
      client.players.byId('invalid-id' as any);
    }).toThrow('Invalid ID');

    expect(() => {
      client.players.byId(-1);
    }).toThrow('Invalid ID');
  });

  test('should validate search queries', () => {
    expect(() => {
      client.players.search('');
    }).toThrow('Invalid search query');

    expect(() => {
      client.players.search('a');
    }).toThrow('Search query must be at least 2 characters');
  });
});
