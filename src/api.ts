import { BitCoinNetWork, sendBitCoin } from "./common_back/chain/Bitcoin/Bitcoin";
import { generateWallet } from "./common_back/chain/Bitcoin/Bitcoin_Wallet";


generateWallet()

// (async () => {
//     const res = await sendBitCoin('cRScPRz75jbMM97KPjgcfUEmDhD8jZMR97s6zTCwQ1cdvLD1Axw1', 'mrFebf6Z5akiN4SKqiNqz4ftujZnTSXDpy', 0.00002, BitCoinNetWork.TESTNET)
//     console.log(res)
// })()