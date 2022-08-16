// reference : https://www.blockcypher.com/dev/bitcoin/#blockchain

const axios = require('axios')

const url = "https://api.blockcypher.com/v1/btc/main";

export enum TYPE {
    HIGH = "high_fee_per_kb", // within 1 to 2 blocks
    MEDIUM = "medium_fee_per_kb", // within 3 to 6 blocks
    LOW = "low_fee_per_kb", // within 7 or more blocks
}

export class estimator {
    private _type: TYPE;

    constructor(type: TYPE = TYPE.HIGH) {
        this._type = type;
    }

    public async estimateFeeRate(): Promise<{feeRate: number, numBlocks: number}> {
        const result = await axios.get(url);
        if(result.statusText !== 'OK') {
            throw "[blockcypher.com] Request Failed";
        }
        var feePerKb = result.data && result.data[this._type];
        if(!feePerKb) {
            throw "[blockcypher.com] There is no data.";
        }

        return {
            feeRate: feePerKb / 1000,
            numBlocks: 1,
        }
    }
}
