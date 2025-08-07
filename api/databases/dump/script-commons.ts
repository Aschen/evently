import { spawnSync } from 'child_process'

/**
 * Returns the absolute path to the specified command using `whereis`.
 */
export function getCommandPath(command: string) {
  const whereisOutput = spawnSync('/usr/bin/whereis', [command])
    .stdout.toString()
    .trim()

  const paths = whereisOutput.split(' ').filter(Boolean)

  return paths.length > 1 ? paths[1] : paths[0]
}

/**
 * Writes an error message to the console in RED
 * and exits the process with the specified status code (default: 1).
 */
export function writeErrorAndExit(error: Error, status = 1) {
  console.error('\n\x1b[31m%s\x1b[0m', error.message)
  console.error(error.stack)

  process.exit(status)
}

/**
 * Executes a command and returns the result.
 *
 * Throws an error if the command fails.
 *
 * Exits the process with a non-zero status code if the command
 * returns a non-zero status code.
 */
export function executeCommand(command: string, args: string[]) {
  const result = spawnSync(command, args)

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    writeErrorAndExit(new Error(result.stderr.toString()))
  }

  return result
}
