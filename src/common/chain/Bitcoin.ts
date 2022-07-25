import { logger } from '../Winston-Logger';

const bip32 = require('bip32')
const bip39 = require('bip39')
const bitcoin = require('bitcoinjs-lib')
Object.defineProperty(global, '_bitcore', { get() { return undefined }, set() { } })

export function generateWallet() {
    //Define the network
    const network = bitcoin.networks.testnet //use networks.testnet for testnet

    // Derivation path
    const path = `m/49'/0'/0'/0` // Use m/49'/1'/0'/0 for testnet

    let mnemonic = bip39.generateMnemonic()
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    let root = bip32.fromSeed(seed, network)

    let account = root.derivePath(path)
    let node = account.derive(0).derive(0)

    let btcAddress = bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network: network,
    }).address

    logger.info(`
Wallet generated:
 - Address  : ${btcAddress},
 - Key : ${node.toWIF()}, 
 - Mnemonic : ${mnemonic}
     
`)
}

export async function sendBitCoin(fromKeyWIF: string, toAddress: string, sendBTCAmount: number) {
    // const key = bitcoin.ECKey.fromWIF(fromKeyWIF)
    // // Check Address
    // logger.info(`[sendBitCoin] SendKey : ${key.pub.getAddress().toString()}`)

    // const tx = new bitcoin.TransactionBuilder();

    const bitcore = require('bitcore-lib')
    const privateKey = bitcore.PrivateKey.fromWIF(fromKeyWIF)
    const fromAddress = privateKey.toAddress()
    logger.info(`[sendBitCoin] SendKey : ${fromAddress}`)

    // Create Address
    // const value = new Buffer('This is a way to generate an address from a string--risky--not random--quessable!!!')

    // const hash = bitcore.crypto.Hash.sha256(value)
    // const bn = bitcore.crypto.BN.fromBuffer(hash)
    // const toAddress = new bitcore.PrivateKey(bn, 'testnet').toAddress()
    
    const Insight = require('bitcore-explorers').Insight;
    const insight = new Insight(bitcore.Networks.testnet)
    logger.info(bitcore.Networks.testnet)
    //https://api.bitcore.io/api/BTC/testnet/address/${fromAddress}/?unspent=true

    insight.getUnspentUtxos(fromAddress, function(err, utxos) {
        if(err) {
            logger.error(JSON.stringify(err, null, 4))
        }
        else {
            //use the UTXOs to create a transaction
            logger.info(utxos)
            const amount = getSatoshiAmount(sendBTCAmount)

            const tx = bitcore.Transaction();
            tx.from(utxos)
            tx.to(toAddress, 10000) // .0001 BTC
            tx.change(fromAddress)
            tx.fee(amount)
            tx.sign(privateKey)

            logger.info(`transaction: ${tx.toObject()}`)
            tx.serialize()

            // const scriptIn = bitcore.Script(tx.toObject().inputs[0].script)
            // logger.info(`input script string: ${scriptIn.toString()}`)

            // const scriptOut = bitcore.Script(tx.toObject().outputs[0].script)
            // logger.info(`output script string: ${scriptOut.toString()}`)

            // tx.addData()
            insight.broadcast(tx, function(err, returnedTxId) {
                if (err) {
                    logger.error(err)
                }
                else {
                    logger.info(`successful broadcast : ${returnedTxId}`)
                }
            })
        }
    })
}

function getSatoshiAmount(btcAmount: number): number {
    return btcAmount * 100000000
}
