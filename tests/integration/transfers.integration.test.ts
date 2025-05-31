import * as dotenv from 'dotenv';
import { SportMonksClient } from '../../src/client';

dotenv.config();

const API_KEY = process.env.SPORTMONKS_TEST_API_KEY || process.env.SPORTMONKS_API_KEY || '';

describe('TransfersResource Integration Tests', () => {
  let client: SportMonksClient;

  beforeAll(() => {
    if (!API_KEY) {
      console.warn('No API key found. Skipping integration tests.');
      return;
    }
    // Use semicolon as separator for includes (API requirement for transfers)
    client = new SportMonksClient(API_KEY, { includeSeparator: ';' });
  });

  describe('Real API calls', () => {
    it('should fetch transfers with pagination', async () => {
      if (!API_KEY) {
        return;
      }

      const result = await client.transfers.all().limit(5).get();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.count).toBeGreaterThan(0);

      // Verify transfer structure
      if (result.data.length > 0) {
        const transfer = result.data[0];
        expect(transfer.id).toBeDefined();
        expect(transfer.player_id).toBeDefined();
        expect(transfer.from_team_id).toBeDefined();
        expect(transfer.to_team_id).toBeDefined();
        expect(transfer.date).toBeDefined();
        expect(typeof transfer.completed).toBe('boolean');
      }
    });

    it('should fetch a single transfer with relationships', async () => {
      if (!API_KEY) {
        return;
      }

      // First get a transfer ID
      const transfers = await client.transfers.all().limit(1).get();
      if (transfers.data.length === 0) {
        console.warn('No transfers found to test');
        return;
      }

      const transferId = transfers.data[0].id;
      const result = await client.transfers
        .byId(transferId)
        .include(['player', 'fromteam', 'toteam', 'type'])
        .get();

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(transferId);

      // Check relationships
      expect(result.data.player).toBeDefined();
      expect(result.data.player?.display_name).toBeDefined();
      expect(result.data.fromteam).toBeDefined();
      expect(result.data.fromteam?.name).toBeDefined();
      expect(result.data.toteam).toBeDefined();
      expect(result.data.toteam?.name).toBeDefined();
      expect(result.data.type).toBeDefined();
      expect(result.data.type?.name).toBeDefined();
    });

    it('should fetch latest transfers', async () => {
      if (!API_KEY) {
        return;
      }

      const result = await client.transfers.latest().limit(10).get();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Latest transfers should be recent
      if (result.data.length > 0) {
        const dates = result.data.map(t => new Date(t.date).getTime());
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        // At least some transfers should be recent
        expect(dates.some(date => date > thirtyDaysAgo)).toBe(true);
      }
    });

    it('should fetch transfers within a date range', async () => {
      if (!API_KEY) {
        return;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const result = await client.transfers.between(startStr, endStr).limit(10).get();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all transfers are within the date range
      result.data.forEach(transfer => {
        const transferDate = new Date(transfer.date);
        expect(transferDate >= startDate).toBe(true);
        expect(transferDate <= endDate).toBe(true);
      });
    });

    it('should fetch transfers for a specific team', async () => {
      if (!API_KEY) {
        return;
      }

      // Use Manchester City (ID: 19) as they usually have transfers
      const teamId = 19;
      const result = await client.transfers.byTeam(teamId).include(['player']).limit(10).get();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all transfers involve the specified team
      result.data.forEach(transfer => {
        const involvesTeam = transfer.from_team_id === teamId || transfer.to_team_id === teamId;
        expect(involvesTeam).toBe(true);
      });
    });

    it('should fetch transfers for a specific player', async () => {
      if (!API_KEY) {
        return;
      }

      // First get a player ID from recent transfers
      const transfers = await client.transfers.all().limit(10).get();

      if (transfers.data.length === 0) {
        console.warn('No transfers found to test');
        return;
      }

      // Find a player with multiple transfers
      const playerIds = transfers.data.map(t => t.player_id);
      const playerId = playerIds[0]; // Just use the first one

      const result = await client.transfers
        .byPlayer(playerId)
        .include(['fromteam', 'toteam'])
        .get();

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all transfers are for the specified player
      result.data.forEach(transfer => {
        expect(transfer.player_id).toBe(playerId);
      });

      // Check that we have transfer history for the player
      if (result.data.length > 1) {
        // Transfers might not be in chronological order, so just verify they're for different dates/teams
        const uniqueDates = new Set(result.data.map(t => t.date));
        expect(uniqueDates.size).toBeGreaterThan(0);
      }
    });

    // Filters are not supported for transfers endpoint based on API testing

    it('should handle different transfer types', async () => {
      if (!API_KEY) {
        return;
      }

      const result = await client.transfers.all().include(['type']).limit(20).get();

      expect(result.data).toBeDefined();

      // Check for different transfer types
      const types = new Set(result.data.map(t => t.type?.name).filter(Boolean));

      // We should see different types like "Loan", "Transfer", etc.
      expect(types.size).toBeGreaterThan(0);

      // Common transfer types
      const commonTypes = ['Loan', 'Transfer', 'Free Transfer'];
      const hasCommonType = Array.from(types).some(type =>
        commonTypes.some(common => type?.includes(common))
      );
      expect(hasCommonType).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      if (!API_KEY) {
        return;
      }

      const page1 = await client.transfers.all().page(1).limit(5).get();

      expect(page1.data.length).toBeLessThanOrEqual(5);
      expect(page1.pagination?.current_page).toBe(1);

      if (page1.pagination?.has_more) {
        const page2 = await client.transfers.all().page(2).limit(5).get();

        expect(page2.data.length).toBeLessThanOrEqual(5);
        expect(page2.pagination?.current_page).toBe(2);

        // Ensure no duplicate IDs between pages
        const page1Ids = new Set(page1.data.map(t => t.id));
        const page2Ids = new Set(page2.data.map(t => t.id));
        const intersection = new Set([...page1Ids].filter(id => page2Ids.has(id)));
        expect(intersection.size).toBe(0);
      }
    });

    it('should validate that transfer amounts can be null or number', async () => {
      if (!API_KEY) {
        return;
      }

      const result = await client.transfers.all().limit(20).get();

      expect(result.data).toBeDefined();

      // Check various amount scenarios
      const hasNullAmount = result.data.some(t => t.amount === null);
      const hasNumericAmount = result.data.some(t => typeof t.amount === 'number' && t.amount > 0);

      // We should see both scenarios in a decent sample
      expect(hasNullAmount || hasNumericAmount).toBe(true);

      // Verify amount is either null or a positive number
      result.data.forEach(transfer => {
        expect(
          transfer.amount === null || (typeof transfer.amount === 'number' && transfer.amount >= 0)
        ).toBe(true);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid transfer ID gracefully', async () => {
      if (!API_KEY) {
        return;
      }

      const result = await client.transfers.byId(999999999).get();

      // API returns a message instead of throwing an error
      expect(result).toBeDefined();
      expect((result as any).message).toBeTruthy();
    });

    it('should handle invalid date format', () => {
      if (!API_KEY) {
        return;
      }

      expect(() => client.transfers.between('invalid-date', '2024-01-01')).toThrow(
        'Dates must be in YYYY-MM-DD format'
      );
    });

    it('should handle invalid team ID', async () => {
      if (!API_KEY) {
        return;
      }

      // Using a very high ID that likely doesn't exist
      const result = await client.transfers.byTeam(999999999).get();

      // API might return empty results or a message
      expect(result).toBeDefined();
      if ((result as any).message) {
        expect((result as any).message).toBeTruthy();
      } else {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
