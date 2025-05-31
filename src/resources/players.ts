import { BaseResource } from '../core/base-resource';
import { QueryBuilder } from '../core/query-builder';
import { PaginatedResponse, SingleResponse, Player } from '../types';

/**
 * Players resource for SportMonks Football API
 * @see https://docs.sportmonks.com/football/endpoints-and-entities/endpoints/players
 */
export class PlayersResource extends BaseResource {
  /**
   * Get all players
   * @returns QueryBuilder for chaining
   */
  all(): QueryBuilder<PaginatedResponse<Player>> {
    return new QueryBuilder<PaginatedResponse<Player>>(this, '');
  }

  /**
   * Get a player by ID
   * @param id - The player ID
   * @returns QueryBuilder for chaining
   */
  byId(id: string | number): QueryBuilder<SingleResponse<Player>> {
    return new QueryBuilder<SingleResponse<Player>>(this, `/${id}`);
  }

  /**
   * Get players by country ID
   * @param countryId - The country ID
   * @returns QueryBuilder for chaining
   */
  byCountry(countryId: string | number): QueryBuilder<PaginatedResponse<Player>> {
    return new QueryBuilder<PaginatedResponse<Player>>(this, `/countries/${countryId}`);
  }

  /**
   * Search for players by name
   * @param searchQuery - The search query
   * @returns QueryBuilder for chaining
   */
  search(searchQuery: string): QueryBuilder<PaginatedResponse<Player>> {
    const encodedQuery = encodeURIComponent(searchQuery);
    return new QueryBuilder<PaginatedResponse<Player>>(this, `/search/${encodedQuery}`);
  }

  /**
   * Get the latest updated players
   * @returns QueryBuilder for chaining
   */
  latest(): QueryBuilder<PaginatedResponse<Player>> {
    return new QueryBuilder<PaginatedResponse<Player>>(this, '/latest');
  }
}
