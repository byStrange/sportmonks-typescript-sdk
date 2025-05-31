import { SportMonksClient } from '../../src/client';

// Only run integration tests if API key is provided
const API_KEY = process.env.SPORTMONKS_API_KEY;
const describeIfApiKey = API_KEY ? describe : describe.skip;

describeIfApiKey('LivescoresResource Integration Tests', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.log('Skipping integration tests - no API key provided');
      return;
    }
    client = new SportMonksClient(API_KEY);
  });

  describe('inplay()', () => {
    it('should fetch current inplay fixtures', async () => {
      const result = await client.livescores
        .inplay()
        .include(['league', 'participants'])
        .page(1)
        .perPage(5)
        .get();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);

      // If there are inplay fixtures
      if (result.data.length > 0) {
        const fixture = result.data[0];
        expect(fixture).toHaveProperty('id');
        expect(fixture).toHaveProperty('league_id');
        expect(fixture).toHaveProperty('state_id');
        expect(fixture.state_id).toBeGreaterThanOrEqual(2); // Inplay states

        // Check includes (these are optional and depend on API response)
        if ((fixture as any).league) {
          expect((fixture as any).league).toHaveProperty('id');
          expect((fixture as any).league).toHaveProperty('name');
        }

        if ((fixture as any).participants) {
          expect(Array.isArray((fixture as any).participants)).toBe(true);
        }
      }
    });
  });

  describe('all()', () => {
    it('should fetch upcoming fixtures (starting within 15 minutes)', async () => {
      const result = await client.livescores
        .all()
        .include(['league', 'venue'])
        .page(1)
        .perPage(10)
        .get();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);

      // Check pagination
      expect(result.pagination).toHaveProperty('count');
      expect(result.pagination).toHaveProperty('per_page');
      expect(result.pagination!.per_page).toBe(10);

      // If there are upcoming fixtures
      if (result.data.length > 0) {
        const fixture = result.data[0];
        expect(fixture).toHaveProperty('id');
        expect(fixture).toHaveProperty('starting_at');
        expect(fixture).toHaveProperty('name');
      }
    });

    it('should filter by league IDs', async () => {
      // Using popular league IDs: Premier League (8), La Liga (564)
      const result = await client.livescores.all().filter('leagues', '8,564').perPage(5).get();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // If there are fixtures from these leagues
      result.data.forEach(fixture => {
        expect([8, 564]).toContain(fixture.league_id);
      });
    });
  });

  describe('latest()', () => {
    it('should fetch recently updated fixtures', async () => {
      const result = await client.livescores
        .latest()
        .include(['scores', 'state'])
        .page(1)
        .perPage(20)
        .get();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);

      // If there are recently updated fixtures
      if (result.data.length > 0) {
        const fixture = result.data[0];
        expect(fixture).toHaveProperty('id');

        // Check for score updates
        if ((fixture as any).scores) {
          expect((fixture as any).scores).toBeDefined();
        }

        // Check state
        if ((fixture as any).state) {
          expect((fixture as any).state).toHaveProperty('id');
          expect((fixture as any).state).toHaveProperty('name');
        }
      }
    });

    it('should include events with types', async () => {
      const result = await client.livescores.latest().include(['events.type']).perPage(5).get();

      expect(result).toHaveProperty('data');

      // If there are fixtures with events
      const fixturesWithEvents = result.data.filter(
        f => (f as any).events && (f as any).events.length > 0
      );

      fixturesWithEvents.forEach(fixture => {
        (fixture as any).events.forEach((event: any) => {
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('type_id');

          // If type is included
          if (event.type) {
            expect(event.type).toHaveProperty('id');
            expect(event.type).toHaveProperty('name');
          }
        });
      });
    });
  });

  describe('combined queries', () => {
    it('should support complex queries with multiple includes and filters', async () => {
      const result = await client.livescores
        .inplay()
        .include(['league.country', 'participants.meta', 'scores', 'events'])
        .page(1)
        .perPage(3)
        .get();

      expect(result).toHaveProperty('data');
      expect(result.pagination!.per_page).toBe(3);

      // Check nested includes work
      if (result.data.length > 0 && (result.data[0] as any).league?.country) {
        expect((result.data[0] as any).league.country).toHaveProperty('id');
        expect((result.data[0] as any).league.country).toHaveProperty('name');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid filters gracefully', async () => {
      try {
        await client.livescores.all().filter('invalid_filter', 'value').get();
      } catch (error: any) {
        expect(error.message).toContain('SportMonks API Error');
      }
    });

    it('should handle rate limiting', async () => {
      // This test depends on your rate limits
      // It's more of a documentation than an actual test
      const promises = Array(5)
        .fill(null)
        .map(() => client.livescores.latest().perPage(1).get());

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');

      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('real-time data characteristics', () => {
    it('should show different states for fixtures', async () => {
      const [inplay, upcoming, latest] = await Promise.all([
        client.livescores.inplay().perPage(5).get(),
        client.livescores.all().perPage(5).get(),
        client.livescores.latest().perPage(5).get()
      ]);

      console.log('Current fixture states:');
      console.log(`- Inplay fixtures: ${inplay.data.length}`);
      console.log(`- Upcoming fixtures (15 min): ${upcoming.data.length}`);
      console.log(`- Recently updated: ${latest.data.length}`);

      // Log some example states if available
      if (inplay.data.length > 0) {
        console.log(
          `Example inplay fixture: ${inplay.data[0].name} (state: ${inplay.data[0].state_id})`
        );
      }
    });
  });
});
