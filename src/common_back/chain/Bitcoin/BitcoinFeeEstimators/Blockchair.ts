// reference : https://blockchair.com/api/docs#link_001

const axios = require('axios')

const url = "https://api.blockchair.com/bitcoin/stats";

export class estimator {
    public async estimateFeeRate(): Promise<{feeRate: number, numBlocks: number}> {
        const result = await axios.get(url);
        if(result.statusText !== 'OK') {
            throw "[blockchair.com] Request Failed";
        }
        var feePerByte = result.data && result.data.data && result.data.data.suggested_transaction_fee_per_byte_sat;
        if(!feePerByte) {
            throw "[blockchair.com] There is no data.";
        }

        return {
            feeRate: feePerByte,
            numBlocks: 1,
        }
    }
}
