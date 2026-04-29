import { type AccessTokenPayload } from './jwt.service';

export type AuthenticatedUser = AccessTokenPayload;

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}
