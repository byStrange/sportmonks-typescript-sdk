import { BaseResource } from '../core/base-resource';
import { QueryBuilder } from '../core/query-builder';
import { PaginatedResponse, SingleResponse, Team } from '../types';

/**
 * Teams resource for SportMonks Football API
 * @see https://docs.sportmonks.com/football/endpoints-and-entities/endpoints/teams
 */
export class TeamsResource extends BaseResource {
  /**
   * Get all teams
   * @returns QueryBuilder for chaining
   */
  all(): QueryBuilder<PaginatedResponse<Team>> {
    return new QueryBuilder<PaginatedResponse<Team>>(this, '');
  }

  /**
   * Get a team by ID
   * @param id - The team ID
   * @returns QueryBuilder for chaining
   */
  byId(id: string | number): QueryBuilder<SingleResponse<Team>> {
    return new QueryBuilder<SingleResponse<Team>>(this, `/${id}`);
  }

  /**
   * Get teams by country ID
   * @param countryId - The country ID
   * @returns QueryBuilder for chaining
   */
  byCountry(countryId: string | number): QueryBuilder<PaginatedResponse<Team>> {
    return new QueryBuilder<PaginatedResponse<Team>>(this, `/countries/${countryId}`);
  }

  /**
   * Get teams by season ID
   * @param seasonId - The season ID
   * @returns QueryBuilder for chaining
   */
  bySeason(seasonId: string | number): QueryBuilder<PaginatedResponse<Team>> {
    return new QueryBuilder<PaginatedResponse<Team>>(this, `/seasons/${seasonId}`);
  }

  /**
   * Search for teams by name
   * @param searchQuery - The search query
   * @returns QueryBuilder for chaining
   */
  search(searchQuery: string): QueryBuilder<PaginatedResponse<Team>> {
    const encodedQuery = encodeURIComponent(searchQuery);
    return new QueryBuilder<PaginatedResponse<Team>>(this, `/search/${encodedQuery}`);
  }
}
