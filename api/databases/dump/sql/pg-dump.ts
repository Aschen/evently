import { config as dotEnvConfig } from 'dotenv-flow'
dotEnvConfig({ default_node_env: 'development', silent: true })

import * as fs from 'node:fs'
import path from 'node:path'
import {
  executeCommand,
  getCommandPath,
  writeErrorAndExit,
} from '../script-commons'

// Define the Docker container name
const containerName = 'evently-postgres'
const dockerContainerName = `api-${containerName}-1`

// Destructure the required environment variables
const POSTGRES_DB_USER_PASSWORD =
  process.env.POSTGRES_DB_USER_PASSWORD ?? 'database'
const POSTGRES_DB_USER = process.env.POSTGRES_DB_USER ?? 'database'
const POSTGRES_DB_NAME = process.env.POSTGRES_DB_NAME ?? 'database'
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost'

const dumpFile = 'seed.sql'
const outputDir = path.join('databases', 'dump', 'sql')

// Define the absolute paths to the Docker and npx executables
const dockerPath = getCommandPath('docker')!

try {
  // Attempt to dump the base schema
  executeCommand(dockerPath, [
    'compose',
    'exec',
    '-T',
    '-e',
    `PGPASSWORD=${POSTGRES_DB_USER_PASSWORD}`,
    containerName,
    'sh',
    '-c',
    `pg_dump --data-only -h ${POSTGRES_HOST} -p 5432 -U ${POSTGRES_DB_USER} --schema=base -d ${POSTGRES_DB_NAME} -f /tmp/${dumpFile}`,
  ])

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Copy the dump file from the Docker container to the local output directory
  executeCommand(dockerPath, [
    'cp',
    `${dockerContainerName}:/tmp/${dumpFile}`,
    `${outputDir}/.`,
  ])

  // Remove the dump file from the Docker container
  executeCommand(dockerPath, [
    'compose',
    'exec',
    containerName,
    'rm',
    `/tmp/${dumpFile}`,
  ])
} catch (error) {
  writeErrorAndExit(error as Error)
}
