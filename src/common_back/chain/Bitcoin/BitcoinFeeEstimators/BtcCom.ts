const axios = require('axios')

const url = "https://btc.com/service/fees/distribution";

export class estimator {
    constructor() {
    }

    public async estimateFeeRate(): Promise<{feeRate: number, numBlocks: number}> {
        const result = await axios.get(url);
        if(result.statusText !== 'OK') {
            throw "[btc.com] Request Failed";
        }
        var feePerByte = result.data && result.data.fees_recommended && result.data.fees_recommended.one_block_fee;
        if(!feePerByte) {
            throw "[btc.com] There is no data.";
        }

        return {
            feeRate: feePerByte,
            numBlocks: 1,
        }
    }
}
