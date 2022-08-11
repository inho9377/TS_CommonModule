
// USE MySQL And Query Execution
// Use Module : mysql2

import { logger } from "../logger_module";

const mysql2 = require("mysql2/promise");

const connections = new Map<string, any>()

const defaultKey = 'default'

export function start_mysql(host: string, port: string, user: string, password: string, database: string, connectionLimit: number, waitForConnections: boolean,
    keepAliveInitialDelay: number, enableKeepAlive: boolean, key: string = defaultKey) {

    logger.info(`[start_mysql] MySQL SET START`)

    setConnection(host, port, user, password, database, connectionLimit, waitForConnections, keepAliveInitialDelay, enableKeepAlive, key)
}

export function setConnection
    (host_: string, port_: string, user_: string, password_: string, database_: string, connectionLimit_: number, waitForConnections_: boolean,
        keepAliveInitialDelay_: number, enableKeepAlive_: boolean, key: string) {

    logger.info(`MySql setConnection, key : ${key}`)

    if (key in connections) {
        logger.error(`[Error][MySql.setConnection] connections already has key : ${key}`)
        return
    }

    const db = {
        host: host_,
        port: port_,
        user: user_,
        password: password_,
        database: database_,
        connectionLimit: connectionLimit_,
        waitForConnections: waitForConnections_,
        keepAliveInitialDelay: keepAliveInitialDelay_,
        enableKeepAlive: enableKeepAlive_
    }
    const connection = mysql2.createPool(db)
    connections.set(key, connection)
}

export async function executeQuery(query: string, key: string = defaultKey): Promise<{ rows: any; fields: any; error: string }> {
    logger.info(`MySQL ExecuteQuery key: ${key}, query: ${query}`)
    if (connections.has(key) === false) {
        logger.error(`[Error][MySql.excuteQuery] connections no has key : ${key}`)
        return {rows: null, fields: null, error: 'connections no has key'}
    }

    const connect = await connections.get(key).getConnection()

    let rows_, fields_
    try {
        [rows_, fields_] = await connect.query(query)
    }
    catch(error: any) {
        logger.error(`[Error][MySql.excuteQuery]${error}`)
        return {rows: null, fields: null, error: error}
    }
    finally {
        await connect.release()
    }

    const result = {
        rows: rows_,
        fields: fields_,
        error: null
    }

    return result
}
