import { BaseResource } from '../core/base-resource';
import { QueryBuilder } from '../core/query-builder';
import { SchedulesBySeasonResponse } from '../types';

/**
 * Schedules resource for accessing schedule information
 * @see https://docs.sportmonks.com/football/endpoints-and-entities/endpoints/schedules
 */
export class SchedulesResource extends BaseResource {
  /**
   * Get schedules by season ID
   * @param seasonId The season ID
   * @example
   * const schedules = await api.schedules.getBySeasonId(19735).get();
   */
  getBySeasonId(seasonId: string | number): QueryBuilder<SchedulesBySeasonResponse> {
    return new QueryBuilder<SchedulesBySeasonResponse>(this, `/seasons/${seasonId}`);
  }
}
