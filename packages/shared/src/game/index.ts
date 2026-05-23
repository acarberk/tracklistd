export {
  gameDetailOutputSchema,
  gameSearchInputSchema,
  gameSearchOutputSchema,
  gameSearchResultSchema,
  type GameDetailOutput,
  type GameSearchInput,
  type GameSearchOutput,
  type GameSearchResult,
} from './search';

export {
  GAME_STATUSES,
  addUserGameInputSchema,
  gameStatusSchema,
  listUserGamesOutputSchema,
  listUserGamesQuerySchema,
  updateUserGameInputSchema,
  userGameSchema,
  type AddUserGameInput,
  type GameStatus,
  type ListUserGamesOutput,
  type ListUserGamesQuery,
  type UpdateUserGameInput,
  type UserGameOutput,
} from './user-game';
