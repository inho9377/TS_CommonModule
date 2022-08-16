const bitcore = require('bitcore-lib')
const axios = require('axios')
Object.defineProperty(global, '_bitcore', { get() { return undefined }, set() { } })

const Estimator = require('./BitcoinFeeEstimator')

// 입력이 트랜잭션에 기여하는 양
const inbutByteContribute = 180 //134

// 출력이 트랜잭션에 기여하는 양
const outputByteContribute = 34

// 트랜잭션에 추가하는 바이트
const addByteContribute = 10

// 바이트당 수수료 (Custom)
const feePerByte = 20

// 수수료 캐싱 간격
const feeRateCacheInterval = 30000; // 30초

export enum BitCoinNetWork {
    TESTNET = 'BTCTEST',
    MAINNET = 'BTC'
}

export async function sendBitCoin(fromKeyWIF: string, toAddress: string, sendBTCAmount: number, network: BitCoinNetWork): Promise<{error: string, transactionHash: string}> {
    const sochain_network = network.toString();
    // const satoshiToSend = getSatoshiAmount(sendBTCAmount)
    const satoshiToSend = bitcore.Unit.fromBTC(sendBTCAmount).toSatoshis();

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
            satoshis: bitcore.Unit.fromBTC(element.value).toSatoshis(),
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

    // get estimated fee rate (sat/vbyte)
    let estimatedFeePerByte = await Estimator.estimateFeeRate(feeRateCacheInterval, inputCount);

    //manually set transaction fees
    transaction.feePerByte(estimatedFeePerByte || feePerByte);

    //Set transaction input
    transaction.from(inputs);

    // set the recieving address and the amount to send
    transaction.to(toAddress, satoshiToSend);

    // Set change address - Address to receive the left over funds after transfer
    transaction.change(fromAddress);

    // Sign transaction with your private key
    transaction.sign(fromKeyWIF);

    fee = transaction.getFee();
    console.log(`available : ${totalAmountAvailable}.  sendAmount : ${satoshiToSend}.  fee: ${fee}`)
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        return {error: 'Balanace is too low', transactionHash: null}
    }


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

    return {error: null, transactionHash: result.data.data.txid}
    // return result.data.data;
}
