import { stringify } from 'querystring';
import { logger } from '../logger';

const bitcore = require('bitcore-lib')
const axios = require('axios')
Object.defineProperty(global, '_bitcore', { get() { return undefined }, set() { } })

// 입력이 트랜잭션에 기여하는 양
const inbutByteContribute = 180 //134

// 출력이 트랜잭션에 기여하는 양
const outputByteContribute = 34

// 트랜잭션에 추가하는 바이트
const addByteContribute = 10

// 바이트당 수수료 (Custom)
const feePerByte = 20

export enum BitCoinNetWork {
    TESTNET = 'BTCTEST',
    MAINNET = 'BTC'
}

export async function sendBitCoin(fromKeyWIF: string, toAddress: string, sendBTCAmount: number, network: BitCoinNetWork): Promise<{ error: string, transactionHash: string }> {
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
            satoshis: Math.floor(Number(element.value) * 100000000),
            script: element.script_hex,
            address: utxos.data.data.address,
            txId: element.txid,
            utxo: null,
            outputIndex: element.output_no,
        };
        totalAmountAvailable += utxo.satoshis;
        inputCount += 1;
        inputs.push(utxo);
    });

    const transactionSize = inputCount * inbutByteContribute + outputCount * outputByteContribute + addByteContribute - inputCount;
    // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

    fee = transactionSize * feePerByte
    logger.info(`available : ${totalAmountAvailable}.  sendAmount : ${satoshiToSend}.  fee: ${fee}`)
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        return { error: 'Balanace is too low', transactionHash: null }
        // throw new Error("Balance is too low for this transaction");
    }

    //Set transaction input
    transaction.from(inputs);

    // set the recieving address and the amount to send
    transaction.to(toAddress, satoshiToSend);

    // Set change address - Address to receive the left over funds after transfer
    transaction.change(fromAddress);

    //manually set transaction fees: 20 satoshis per byte
    transaction.fee(fee * feePerByte);

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

    return { error: null, transactionHash: result.data.data.txHash }
    // return result.data.data;
}

function getSatoshiAmount(btcAmount: number): number {
    return btcAmount * 100000000
}
