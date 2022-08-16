// reference : https://bitcoiner.live/doc/api

const axios = require('axios')

const url = "https://bitcoiner.live/api/fees/estimates/latest";

// confirmation probability
export enum CONFIDENCE {
    PERCENT90 = 0.9,
    PERCENT80 = 0.8,
    PERCENT50 = 0.5,
}

// confirmation in minutes
export enum TIME {
    MINUTES30 = "30",
    MINUTES60 = "60",
    MINUTES120 = "120",
    MINUTES180 = "180",
    MINUTES360 = "360",
    MINUTES720 = "720",
    MINUTES1440 = "1440",
}

export class estimator {
    private _uri: string;
    private _time: TIME;

    constructor(confidence: CONFIDENCE = CONFIDENCE.PERCENT80, time: TIME = TIME.MINUTES30) {
        this._uri = url + `?confidence=${confidence.toString()}`
        this._time = time;
    }

    public async estimateFeeRate(): Promise<{feeRate: number, numBlocks: number}> {
        const result = await axios.get(this._uri);
        if(result.statusText !== 'OK') {
            throw "[bitcoiner.live] Request Failed";
        }
        var data = result.data && result.data.estimates && result.data.estimates[this._time];
        if(!data) {
            throw "[bitcoiner.live] There is no matched confirm time data.";
        }

        return {
            feeRate: data.sat_per_vbyte,
            numBlocks: 1,
        }
    }
}
