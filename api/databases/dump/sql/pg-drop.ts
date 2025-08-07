import { config as dotEnvConfig } from 'dotenv-flow'
dotEnvConfig({ default_node_env: 'development', silent: true })

import {
  executeCommand,
  getCommandPath,
  writeErrorAndExit,
} from '../script-commons'

// Define the Docker container name
const SERVICE_NAME = 'evently-postgres'
const SERVICE_NAME_TEST = 'evently-postgres-test'

const POSTGRES_DB_NAME = process.env.POSTGRES_DB_NAME ?? 'database'
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'database'

// Define the absolute path to the Docker executable
const dockerPath = getCommandPath('docker')!

function dropSchema(containerName: string, schemaName: string) {
  executeCommand(dockerPath, [
    'compose',
    'exec',
    '-T',
    '-e',
    `PGPASSWORD=${POSTGRES_PASSWORD}`,
    containerName,
    'sh',
    '-c',
    `psql -h localhost -p 5432 -U postgres -d ${POSTGRES_DB_NAME} -c "DROP SCHEMA ${schemaName} CASCADE;"`,
  ])
}

if (process.argv.find((arg) => arg === '--test')) {
  console.info(`Dropping schemas in ${SERVICE_NAME_TEST}\n`)

  try {
    // Attempt to drop the base schema
    dropSchema(SERVICE_NAME_TEST, 'base')

    // Attempt to drop the drizzle schema
    dropSchema(SERVICE_NAME_TEST, 'drizzle')
  } catch (error) {
    writeErrorAndExit(error as Error)
  }
} else {
  console.info(`Dropping schemas in ${SERVICE_NAME}`)

  try {
    // Attempt to drop the base schema
    dropSchema(SERVICE_NAME, 'base')

    // Attempt to drop the drizzle schema
    dropSchema(SERVICE_NAME, 'drizzle')
  } catch (error) {
    writeErrorAndExit(error as Error)
  }
}
