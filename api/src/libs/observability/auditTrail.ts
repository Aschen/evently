import { logger } from './logger'

/**
 * Logs an audit trail message to keep track of user actions
 *
 * @param userId - The user ID
 * @param message - The message to log
 */
export function auditTrail({
  userId,
  message,
}: {
  userId: string
  message: string
}) {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  return logger
    .child({
      msgPrefix: `[AuditTrail] (${userId}) `,
    })
    .info(message)
}
