import { ApiErrorCode, HttpStatus } from '@/shared/api/api-error.constants'
import type { ErrorMessages } from '@/shared/api/api-error.utils'

// The words that the sign-in page shows for the answers of the API.

export const signInMessages = {
  /** Why signing in failed; any other failure shows its own message. */
  failed: {
    code: { [ApiErrorCode.RateLimited]: 'Too many attempts. Wait a moment, then try again.' },
    status: { [HttpStatus.Unauthorized]: 'The email or the password is wrong.' },
  } satisfies ErrorMessages,
}
