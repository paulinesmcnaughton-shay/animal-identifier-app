import { IdentifyError } from './types'

export function friendlyIdentifyError(error: unknown): string {
  if (!(error instanceof IdentifyError)) {
    return "Couldn't identify that one. Try a clearer angle or step back a little."
  }

  const message = error.message.trim()
  if (!message || /^model:/i.test(message) || /claude-(opus|sonnet)/i.test(message)) {
    return "We couldn't reach the identifier. Try again, or pick the breed from the list."
  }

  return message
}
