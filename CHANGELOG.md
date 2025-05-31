# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-31

### Added

- Initial release of SportMonks TypeScript SDK
- Full TypeScript support with comprehensive type definitions
- Support for 10 resources with 56 endpoints:
  - **Leagues** (8 endpoints): all, byId, byCountry, search, live, byDate, byTeam, currentByTeam
  - **Teams** (5 endpoints): all, byId, byCountry, bySeason, search
  - **Players** (5 endpoints): all, byId, byCountry, search, latest
  - **Fixtures** (13 endpoints): all, byId, byIds, byDate, byDateRange, byTeamAndDateRange, byTeamAndSeason, headToHead, search, byLivescores, byFixtureMulti, latest, byTvStation
  - **Standings** (5 endpoints): all, bySeasonId, byRoundId, bySeasonIdCorrected, liveByLeagueId
  - **Livescores** (3 endpoints): all, inplay, latest
  - **Transfers** (6 endpoints): all, byId, latest, byDateRange, byPlayerId, byTeamId
  - **Coaches** (5 endpoints): all, byId, byCountryId, byTeamId, search
  - **Referees** (5 endpoints): all, byId, byCountryId, bySeasonId, search
  - **Venues** (4 endpoints): all, byId, bySeasonId, search
- Method chaining for intuitive query building
- Automatic retry logic with exponential backoff
- Real-time polling utilities for livescores and transfers
- Input validation for dates, IDs, and search queries
- Rate limit information in responses
- Comprehensive error handling with detailed messages
- Support for includes, filters, pagination, and sorting
- Custom include separator support (for transfers endpoint)
- Enhanced support for SportMonks' advanced query syntax
  - `includeFields()` method for field selection on includes
  - `withIncludes()` method for complex include configurations
  - Support for multiple filter values using arrays
  - `SportMonksSyntaxBuilder` utility for programmatic query building
  - Full TypeScript types for SportMonks syntax patterns
- Comprehensive test coverage improvements (97.62% coverage)

### Features

- **Type Safety**: Strong TypeScript types for all entities and API responses
- **Method Chaining**: Fluent API design for building complex queries
- **Error Handling**: Detailed error messages with context
- **Retry Logic**: Automatic retries with exponential backoff for failed requests
- **Polling Utilities**: Built-in support for real-time data updates
- **Validation**: Input validation for common parameters
- **Flexible Configuration**: Customizable timeout, base URL, and include separator

### Testing

- Comprehensive test suite with 330+ tests
- Unit tests for all resources and utilities
- Integration tests with real API (when API key provided)
- 97.62% code coverage

### Documentation

- Complete README with installation and usage instructions
- JSDoc comments on all public methods
- Examples for all major use cases
- Migration guide for future versions
