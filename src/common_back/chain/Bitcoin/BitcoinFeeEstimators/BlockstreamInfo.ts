// reference : https://github.com/Blockstream/esplora/blob/master/API.md#fee-estimates

const axios = require('axios')

const url = "https://blockstream.info/api/fee-estimates";

export class estimator {
    public async estimateFeeRate(numBlocks: number): Promise<{feeRate: number, numBlocks: number}> {
        if(!numBlocks) {
            throw "[blockstream.info] Invalid Parameter";
        }

        // resampling numBlocks
        // because BlockstreamInfo provides fee rate for 1~25,144,504,1008 blocks.
        let _numBlocks : number;
        if(numBlocks >= 1008)
            _numBlocks = 1008;
        else if(numBlocks >= 504)
            _numBlocks = 504;
        else if(numBlocks >= 144)
            _numBlocks = 144;
        else if(numBlocks >= 25)
            _numBlocks = 25;
        else
            _numBlocks = numBlocks;

        const result = await axios.get(url);
        if(result.statusText !== 'OK') {
            throw "[blockstream.info] Request Failed";
        }
        var feePerByte = result.data && result.data[_numBlocks];
        if(!feePerByte) {
            throw "[blockstream.info] There is no data.";
        }

        return {
            feeRate: feePerByte,
            numBlocks: numBlocks,
        }
    }
}
