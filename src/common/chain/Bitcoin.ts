import { stringify } from 'querystring';
import { logger } from '../Winston-Logger';

const bip32 = require('bip32')
const bip39 = require('bip39')
const bitcoin = require('bitcoinjs-lib')
const bitcore = require('bitcore-lib')
const axios = require('axios')
Object.defineProperty(global, '_bitcore', { get() { return undefined }, set() { } })

export enum BitCoinNetWork {
    TESTNET = 'BTCTEST',
    MAINNET = 'BTC'
}

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

export async function sendBitCoin(fromKeyWIF: string, toAddress: string, sendBTCAmount: number, network: BitCoinNetWork) {
    
    const sochain_network = network.toString();
    const satoshiToSend = getSatoshiAmount(sendBTCAmount)

    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;

    const privateKey = bitcore.PrivateKey.fromWIF(fromKeyWIF)
    const fromAddress = privateKey.toAddress()

    const utxos = await axios.get(
        `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${fromAddress}`
    );
    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;

    let inputs = [];
    utxos.data.data.txs.forEach(async (element) => {
        let utxo: { satoshis: number, script: string, address: string, txId: string, utxo: string, outputIndex: string } = {
            satoshis: null,
            script: null,
            address: null,
            txId: null,
            utxo: null,
            outputIndex: null
        };
        utxo.satoshis = Math.floor(Number(element.value) * 100000000);
        utxo.script = element.script_hex;
        utxo.address = utxos.data.data.address;
        utxo.txId = element.txid;
        utxo.outputIndex = element.output_no;
        totalAmountAvailable += utxo.satoshis;
        inputCount += 1;
        inputs.push(utxo);
    });

    const transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

    fee = transactionSize * 20
    logger.info(`available : ${totalAmountAvailable}.  sendAmount : ${satoshiToSend}.  fee: ${fee}`)
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        throw new Error("Balance is too low for this transaction");
    }

    //Set transaction input
    transaction.from(inputs);

    // set the recieving address and the amount to send
    transaction.to(toAddress, satoshiToSend);

    // Set change address - Address to receive the left over funds after transfer
    transaction.change(fromAddress);

    //manually set transaction fees: 20 satoshis per byte
    transaction.fee(fee * 20);

    // Sign transaction with your private key
    transaction.sign(fromKeyWIF);

    // serialize Transactions
    const serializedTransaction = transaction.serialize();
    // Send transaction
    const result = await axios({
        method: "POST",
        url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
        data: {
            tx_hex: serializedTransaction,
        },
    });

    return result.data.data;
}

function getSatoshiAmount(btcAmount: number): number {
    return btcAmount * 100000000
}
