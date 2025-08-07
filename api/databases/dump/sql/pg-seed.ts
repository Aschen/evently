import { config as dotEnvConfig } from 'dotenv-flow'
dotEnvConfig({ default_node_env: 'development', silent: true })

import path from 'node:path'
import {
  executeCommand,
  getCommandPath,
  writeErrorAndExit,
} from '../script-commons'

// Replace these variables with your actual database details
const containerName = 'evently-postgres'
const dockerContainerName = `api-${containerName}-1`
const dockerPath = getCommandPath('docker')!

const POSTGRES_DB_USER_PASSWORD =
  process.env.POSTGRES_DB_USER_PASSWORD ?? 'database'
const POSTGRES_DB_USER = process.env.POSTGRES_DB_USER ?? 'database'
const POSTGRES_DB_NAME = process.env.POSTGRES_DB_NAME ?? 'database'

process.env.PGPASSWORD = POSTGRES_DB_USER_PASSWORD

const dumpFile = 'seed.sql'
const inputFile = path.join('databases', 'dump', 'sql', dumpFile)

try {
  // Copy the dump file from the host to the container
  executeCommand(dockerPath, [
    'cp',
    inputFile,
    `${dockerContainerName}:/tmp/${dumpFile}`,
  ])

  // Use docker compose to execute psql command to load the dump file into the database
  executeCommand(dockerPath, [
    'compose',
    'exec',
    '-T',
    '-e',
    `PGPASSWORD=${POSTGRES_DB_USER_PASSWORD}`,
    containerName,
    'sh',
    '-c',
    `psql -h localhost -p 5432 -U ${POSTGRES_DB_USER} -d ${POSTGRES_DB_NAME} --set ON_ERROR_STOP=on -f /tmp/${dumpFile}`,
  ])

  // Optionally, you can remove the dump file from the container after loading
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
