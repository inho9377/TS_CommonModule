const axios = require('axios')

const url = "https://api.blockchain.info/mempool/fees";

export enum TYPE {
    REGULAR = "regular",
    PRIORITY = "priority",
}

export class estimator {
    private _type: TYPE;

    constructor(type: TYPE = TYPE.REGULAR) {
        this._type = type;
    }

    public async estimateFeeRate(): Promise<{feeRate: number, numBlocks: number}> {
        const result = await axios.get(url);
        if(result.statusText !== 'OK') {
            throw "[blockchain.info] Request Failed";
        }
        var feePerByte = result.data && result.data[this._type];
        if(!feePerByte) {
            throw "[blockchain.info] There is no data.";
        }

        return {
            feeRate: feePerByte,
            numBlocks: 1,
        }
    }
}
