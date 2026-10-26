import { ApiErrorCode, type ApiErrorMessages } from '@/shared/api/error'
import { HttpStatus } from '@/shared/api/http'

// The words that the login page shows for the answers of the API.

export const loginMessages = {
  /** Why logging in failed; any other failure shows its own message. */
  failed: {
    code: { [ApiErrorCode.RateLimited]: 'Too many attempts. Wait a moment, then try again.' },
    status: { [HttpStatus.Unauthorized]: 'The email or the password is wrong.' },
  } satisfies ApiErrorMessages,
}
