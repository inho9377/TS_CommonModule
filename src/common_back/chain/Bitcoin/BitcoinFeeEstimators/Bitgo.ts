// reference : https://api.bitgo.com/docs/#operation/v2.tx.getfeeestimate

const axios = require('axios')

const url = "https://www.bitgo.com/api/v2/btc/tx/fee";

export class estimator {
    private _uri: string;

    public async estimateFeeRate(numBlocks: number = 2): Promise<{feeRate: number, numBlocks: number}> {
        if(!numBlocks) {
            throw "[bitgo.com] Invalid Parameter";
        }
        
        const result = await axios.get(
            url + `?numBlocks=${(numBlocks > 1 ? numBlocks : 2).toString()}`); // numbBlocks must be greater than 1
        if(result.statusText !== 'OK') {
            throw "[bitgo.com] Request Failed";
        }
        var feePerKb = result.data && result.data.feePerKb;
        if(!feePerKb) {
            throw "[bitgo.com] There is no data.";
        }

        return {
            feeRate: feePerKb / 1000,
            numBlocks: numBlocks,
        }
    }
}
