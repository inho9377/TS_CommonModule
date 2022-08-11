
// Load Environment Variables By Development Enviroment (Test / Local / Development / Production)
// envFile Path : Root / .env / {Environment}.env
// Use Module : dotEnv


import { logger } from "./logger_module";

export enum Environment {
    TEST = "Test",
    LOCAL = "Local",
    DEVELOPMENT = "Development",
    PRODUCTION = "Production",
}
let currentEnv: string

export function isEnvironment(env: Environment): boolean {
    return env.toString().toLowerCase() ===currentEnv.toLowerCase();
}

//process.env.NODE_ENV
function loadEnv(nodeEnv: string) {
    currentEnv = nodeEnv
    logger.info(`LoadEnv : ${nodeEnv}`);
    const env = nodeEnv.toString().toLowerCase()
    require('dotenv').config({ path: `./.env/${env}.env` })
}

export function start_loadEnv(nodeEnv: string) {
    logger.info('Start LoadEnv.ts')
    loadEnv(nodeEnv)
}
