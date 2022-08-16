const bitcoiner = require('./BitcoinFeeEstimators/BitcoinerLive');
const bitgo = require('./BitcoinFeeEstimators/Bitgo');
// const blockchainInfo = require('./BitcoinFeeEstimators/BlockchainInfo'); // Can not find reference details.
const blockchair = require('./BitcoinFeeEstimators/Blockchair');
const blockcypher = require('./BitcoinFeeEstimators/BlockCypher');
const blockstream = require('./BitcoinFeeEstimators/BlockstreamInfo');
// const btccom = require('./BitcoinFeeEstimators/BtcCom'); // Can not find reference details.

// 예상 수수료를 확인할 서비스 목록.
const estimators = [
    new blockstream.estimator(),
    new blockcypher.estimator(blockcypher.TYPE.HIGH),
    new bitcoiner.estimator(bitcoiner.CONFIDENCE.PERCENT90, bitcoiner.TIME.MINUTES30), // little bit slow
    new bitgo.estimator(), // too small fee rate
    new blockchair.estimator(), // little bit slow. too small fee rate.
    // new blockchainInfo.estimator(blockchainInfo.TYPE.PRIORITY), // Can not find reference details.
    // new btccom.estimator(), // Can not find reference details.
]

class FeeEstimator {
    private static _cachedFeeRateForNumBlocks = new Map<number, {feeRate: number, timestamp: number}>;

    // 현재 예상 satoshi per byte 반환.
    // cacheInterval : millisecond. 설정한 시간 이내에 재 요청 할경우 이전에 캐싱한 값을 사용.
    public static async estimateFeeRate(cacheInterval: number = 0, numBlocks: number = 1): Promise<number> {
        if(cacheInterval > 0) {
            let cached = FeeEstimator._cachedFeeRateForNumBlocks[numBlocks];
            if(cached &&
                cached.timestamp + cacheInterval > Date.now() &&
                cached.feeRate > 0) {
                return cached.feeRate;
            }
        }

        // 서비스 목록에서 차례대로 예상 수수료를 가져온다. 오류시 다음 차례에서 가져온다.
        for(var estimator of estimators) {
            var result;
            try {
                result = await estimator.estimateFeeRate(numBlocks);
            }
            catch (e) {
                console.error(e);
            }

            if(result.feeRate > 0) {
                FeeEstimator._cachedFeeRateForNumBlocks[result.numBlocks] = {
                    feeRate: result.feeRate,
                    timestamp: Date.now(),
                };
                return result.feeRate;
            }
        }

        return null;
    }
}

module.exports = FeeEstimator;
