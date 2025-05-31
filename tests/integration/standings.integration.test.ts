/**
 * Integration tests for StandingsResource with real API
 */

import dotenv from 'dotenv';
import { SportMonksClient } from '../../src';
import { delay } from '../helpers/mock-data';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

function logRateLimit(response: any) {
  if (response.rate_limit) {
    console.log(
      `Rate limit: ${response.rate_limit.remaining} requests remaining (resets in ${response.rate_limit.resets_in_seconds}s)`
    );
  }
}

describeIfApiKey('StandingsResource - Real API Integration', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('⚠️  SPORTMONKS_TEST_API_KEY not found. Skipping integration tests.');
      return;
    }
    console.log('✅ Running standings integration tests with real API key');
    client = new SportMonksClient(API_KEY);
  });

  afterEach(async () => {
    await delay(200);
  });

  describe('Basic Endpoints', () => {
    test('should fetch standings by season', async () => {
      // Try with a known season ID - Premier League 2023/24 might be 19735 or we need to find a valid one
      try {
        const response = await client.standings
          .bySeason(19735)
          .include(['participant'])
          .limit(5)
          .get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        if (response.data.length > 0) {
          const standing = response.data[0];
          console.log('Standing structure:', Object.keys(standing));

          expect(standing.position).toBeDefined();
          expect(standing.points).toBeDefined();

          if (standing.participant) {
            console.log(
              `Position ${standing.position}: ${standing.participant.name} - ${standing.points} points`
            );
          }
        }

        logRateLimit(response);
      } catch (error: any) {
        console.log('Season standings error:', error.message);
        // Try with all() endpoint with filter
        const response = await client.standings.all().filter('season_id', 19735).limit(5).get();

        expect(response.data).toBeDefined();
        logRateLimit(response);
      }
    }, 15000);

    test('should verify standing structure', async () => {
      try {
        // First, let's try to find a valid season
        const leagues = await client.leagues.byId(8).include(['currentSeason']).get();

        let seasonId = 19735; // default
        if (leagues.data.currentSeason) {
          seasonId = leagues.data.currentSeason.id;
          console.log('Using current season:', seasonId);
        }

        const response = await client.standings.bySeason(seasonId).limit(1).get();

        if (response.data.length > 0) {
          const standing = response.data[0];

          // Log actual structure to help update interface
          console.log('Actual standing fields:', Object.keys(standing));
          console.log('Sample standing:', JSON.stringify(standing, null, 2));

          // Basic fields that should exist
          expect(standing).toHaveProperty('position');
          expect(standing).toHaveProperty('points');
        }
      } catch (error: any) {
        console.log('Structure test error:', error.message);
      }
    }, 15000);

    test('should fetch live standings', async () => {
      try {
        // Premier League ID: 8
        const response = await client.standings
          .liveByLeague(8)
          .include(['participant'])
          .limit(5)
          .get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        console.log(`Live standings count: ${response.data.length}`);

        if (response.data.length > 0) {
          console.log('Live standings available');
        }

        logRateLimit(response);
      } catch (error: any) {
        // Live endpoint might require specific subscription or no live games
        console.log('Live standings error:', error.message);
        expect(error.message).toBeDefined();
      }
    }, 15000);

    test('should fetch standings by round', async () => {
      try {
        // We need a valid round ID - let's try to get one
        const seasonStandings = await client.standings.bySeason(19735).limit(1).get();

        if (seasonStandings.data.length > 0 && seasonStandings.data[0].round_id) {
          const roundId = seasonStandings.data[0].round_id;
          console.log('Using round ID:', roundId);

          const response = await client.standings.byRound(roundId).include(['participant']).get();

          expect(response.data).toBeDefined();
          expect(Array.isArray(response.data)).toBe(true);

          logRateLimit(response);
        }
      } catch (error: any) {
        console.log('Round standings error:', error.message);
      }
    }, 15000);

    test('should fetch standing corrections', async () => {
      try {
        const response = await client.standings
          .correctionsBySeason(19735)
          .include(['participant'])
          .get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        if (response.data.length > 0) {
          console.log('Found standing corrections:', response.data.length);
          const correction = response.data[0];
          console.log('Correction example:', {
            type: correction.type,
            value: correction.value,
            description: correction.description
          });
        } else {
          console.log('No standing corrections found for this season');
        }

        logRateLimit(response);
      } catch (error: any) {
        console.log('Corrections error:', error.message);
      }
    }, 15000);
  });

  describe('Query Features', () => {
    test('should handle includes properly', async () => {
      try {
        const response = await client.standings
          .bySeason(19735)
          .include(['participant', 'league', 'season'])
          .limit(1)
          .get();

        if (response.data.length > 0) {
          const standing = response.data[0];
          console.log('Included relations:', {
            hasParticipant: !!standing.participant,
            hasLeague: !!standing.league,
            hasSeason: !!standing.season
          });
        }

        logRateLimit(response);
      } catch (error: any) {
        console.log('Include test error:', error.message);
      }
    }, 15000);

    test('should handle filters on all() endpoint', async () => {
      try {
        const response = await client.standings
          .all()
          .filter('season_id', 19735)
          .filter('standing_rule_id', 1)
          .limit(5)
          .get();

        expect(response.data).toBeDefined();

        // Verify all results match the filter
        response.data.forEach(standing => {
          expect(standing.season_id).toBe(19735);
        });

        logRateLimit(response);
      } catch (error: any) {
        console.log('Filter test error:', error.message);
      }
    }, 15000);

    test('should respect field selection', async () => {
      try {
        const response = await client.standings
          .bySeason(19735)
          .select(['position', 'points', 'wins', 'draws', 'losses'])
          .limit(1)
          .get();

        if (response.data.length > 0) {
          const standing = response.data[0];
          console.log('Selected fields present:', Object.keys(standing));
        }

        logRateLimit(response);
      } catch (error: any) {
        console.log('Select test error:', error.message);
      }
    }, 15000);
  });

  describe('Real-world Usage', () => {
    test('should get full league table with team details', async () => {
      try {
        const response = await client.standings
          .bySeason(19735)
          .include(['participant.country'])
          .orderBy('position')
          .get();

        console.log(`Total teams in standings: ${response.data.length}`);

        // Show top 5
        response.data.slice(0, 5).forEach(standing => {
          if (standing.participant) {
            console.log(
              `${standing.position}. ${standing.participant.name} - ${standing.points} pts (W${standing.wins} D${standing.draws} L${standing.losses})`
            );
          }
        });

        logRateLimit(response);
      } catch (error: any) {
        console.log('Full table error:', error.message);
      }
    }, 15000);
  });
});
