//
// Test Code OR Common Simple Execution Code by Common Custom Module

import {start_loadEnv} from "./load_env";

start_loadEnv(process.env.NODE_ENV)
require('./chain/Ethers-Web3').setWeb3(process.env.JSON_RPC)
require('./chain/Ethers-Web3').createRandomAccount()
