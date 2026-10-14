import { ApiErrorCode, HttpStatus } from '@/shared/api/api-error.constants'
import type { ErrorMessages } from '@/shared/api/api-error.utils'

// The words that the account pages show for the answers of the API.

export const accountMessages = {
  /** Why signing in failed; any other failure shows its own message. */
  signInFailed: {
    code: { [ApiErrorCode.RateLimited]: 'Too many attempts. Wait a moment, then try again.' },
    status: { [HttpStatus.Unauthorized]: 'The email or the password is wrong.' },
  } satisfies ErrorMessages,
  /** The account was created, but signing in with it failed. */
  createdWithoutSession: 'The account is created. Sign in with it.',
}
