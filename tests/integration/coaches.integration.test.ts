import { SportMonksClient } from '../../src/client';

// Integration tests that make real API calls
// Only run these with a valid API key
describe('CoachesResource Integration Tests', () => {
  let client: SportMonksClient;
  const API_KEY = process.env.SPORTMONKS_API_KEY;

  // Skip tests if no API key is provided
  const conditionalDescribe = API_KEY ? describe : describe.skip;

  beforeAll(() => {
    if (API_KEY) {
      client = new SportMonksClient(API_KEY);
    }
  });

  conditionalDescribe('Real API calls', () => {
    describe('all()', () => {
      it('should fetch coaches with pagination', async () => {
        const response = await client.coaches.all().perPage(5).get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeLessThanOrEqual(5);
        expect(response.pagination).toBeDefined();
        expect(response.rate_limit).toBeDefined();

        // Validate coach structure if we have data
        if (response.data.length > 0) {
          const coach = response.data[0];
          expect(coach.id).toBeDefined();
          expect(coach.sport_id).toBeDefined();
          expect(coach.country_id).toBeDefined();
          expect(coach.name).toBeDefined();
          expect(coach.display_name).toBeDefined();
        }
      });

      it('should support includes for relationships', async () => {
        const response = await client.coaches
          .all()
          .include(['country', 'nationality'])
          .perPage(1)
          .get();

        expect(response.data).toBeDefined();

        if (response.data.length > 0) {
          const coach = response.data[0];
          // Check if includes were properly processed
          // Note: API might not return includes if not available
          if (coach.country) {
            expect(coach.country.id).toBeDefined();
            expect(coach.country.name).toBeDefined();
          }
        }
      });
    });

    describe('byId()', () => {
      it('should fetch a specific coach', async () => {
        // First get a coach ID from the list
        const listResponse = await client.coaches.all().perPage(1).get();

        if (listResponse.data.length > 0) {
          const coachId = listResponse.data[0].id;

          const response = await client.coaches.byId(coachId).get();

          expect(response.data).toBeDefined();
          expect(response.data.id).toBe(coachId);
          expect(response.data.name).toBeDefined();
          expect(response.data.display_name).toBeDefined();
        }
      });

      it('should handle non-existent coach ID', async () => {
        await expect(client.coaches.byId(99999999).get()).rejects.toThrow();
      });
    });

    describe('search()', () => {
      it('should search coaches by name', async () => {
        // Search for a well-known coach
        const response = await client.coaches.search('Guardiola').get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Check that results contain the search term (case-insensitive)
        response.data.forEach(coach => {
          const nameMatch =
            coach.name.toLowerCase().includes('guardiola') ||
            coach.common_name.toLowerCase().includes('guardiola') ||
            coach.lastname.toLowerCase().includes('guardiola');
          expect(nameMatch).toBe(true);
        });
      });

      it('should return empty results for non-existent coach', async () => {
        const response = await client.coaches.search('NonExistentCoach12345').get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBe(0);
      });

      it('should handle special characters in search', async () => {
        const response = await client.coaches.search('José').get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        // Results may vary based on API data
      });
    });

    describe('byCountry()', () => {
      it('should fetch coaches by country', async () => {
        // Use England (country ID 462) as it should have many coaches
        const response = await client.coaches.byCountry(462).perPage(10).get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Verify all coaches are from the specified country
        response.data.forEach(coach => {
          expect(coach.country_id).toBe(462);
        });
      });

      it('should support pagination for country coaches', async () => {
        const page1 = await client.coaches.byCountry(462).page(1).perPage(5).get();

        const page2 = await client.coaches.byCountry(462).page(2).perPage(5).get();

        expect(page1.data).toBeDefined();
        expect(page2.data).toBeDefined();

        // Ensure different pages have different coaches
        if (page1.data.length > 0 && page2.data.length > 0) {
          const page1Ids = page1.data.map(c => c.id);
          const page2Ids = page2.data.map(c => c.id);
          const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
          expect(hasOverlap).toBe(false);
        }
      });
    });

    describe('latest()', () => {
      it('should fetch recently updated coaches', async () => {
        const response = await client.coaches.latest().perPage(10).get();

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Latest endpoint might return empty if no recent updates
        if (response.data.length > 0) {
          const coach = response.data[0];
          expect(coach.id).toBeDefined();
          expect(coach.name).toBeDefined();
        }
      });
    });

    describe('Chaining and filtering', () => {
      it('should support complex queries with multiple parameters', async () => {
        const response = await client.coaches
          .all()
          .include(['country', 'nationality', 'teams'])
          .orderBy('name')
          .orderBy('asc')
          .perPage(5)
          .page(1)
          .get();

        expect(response.data).toBeDefined();
        expect(response.pagination?.per_page).toBe(5);
        expect(response.pagination?.current_page).toBe(1);
      });

      it('should handle filters if supported', async () => {
        // Note: Actual filter parameters depend on API support
        const response = await client.coaches.all().filter('gender', 'male').perPage(5).get();

        expect(response.data).toBeDefined();
        // Verify filter was applied if data is returned
        response.data.forEach(coach => {
          expect(coach.gender).toBe('male');
        });
      });
    });

    describe('Rate limiting', () => {
      it('should include rate limit information', async () => {
        const response = await client.coaches.all().perPage(1).get();

        expect(response.rate_limit).toBeDefined();
        expect(response.rate_limit?.remaining).toBeGreaterThanOrEqual(0);
        expect(response.rate_limit?.resets_in_seconds).toBeGreaterThanOrEqual(0);
        expect(response.rate_limit?.requested_entity).toBe('Coach');
      });
    });

    describe('Error scenarios', () => {
      it('should handle invalid country ID', async () => {
        await expect(client.coaches.byCountry(99999).get()).rejects.toThrow();
      });

      it('should handle invalid includes', async () => {
        // API might ignore invalid includes or throw error
        const responsePromise = client.coaches
          .all()
          .include(['invalid_relationship'])
          .perPage(1)
          .get();

        // Depending on API behavior, it might succeed with warning or fail
        await expect(responsePromise).resolves.toBeDefined();
      });
    });
  });

  // Tests that don't require API key
  describe('Client configuration', () => {
    it('should properly construct resource paths', () => {
      const testClient = new SportMonksClient('test-key');
      expect(testClient.coaches).toBeDefined();

      // Test that methods exist
      expect(testClient.coaches.all).toBeDefined();
      expect(testClient.coaches.byId).toBeDefined();
      expect(testClient.coaches.byCountry).toBeDefined();
      expect(testClient.coaches.search).toBeDefined();
      expect(testClient.coaches.latest).toBeDefined();
    });
  });
});
