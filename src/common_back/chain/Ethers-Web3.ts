import { logger } from "../Winston-Logger";

const Web3 = require('web3')

const ERC20ABI = require('../../../abi/ERC20.abi.json')
const BatchTransferABI = require('../../../abi/BatchTransfer.abi.json')

let web3 = new Map<TokenName, any>()
const tokenContracts = new Map<string, any>()
let batchTransferContract
let fromWalletAddress

export enum TokenName {
    ETH = "ETH",
    BTC = "BTC",
    MPANDO = "MPANDO",
    PANDO = "PANDO"
}

export interface sendTokenInfo {
    id: string, address: string, tokenAddress: string, tokenName: TokenName, amount: number
}

export interface resultHashInfo {
    id: string[], error: string; transactionHash: string;
}


export function setTokenRPCWeb3(walletAddress: string, walletPrivate: string, batchTransferAddress: string, jsonRPC: string, tokenRPC: TokenName = TokenName.ETH) {
    setWeb3(jsonRPC, tokenRPC)

    setWalletInfo(walletAddress, walletPrivate, tokenRPC)
    fromWalletAddress = walletAddress

    logger.info(`[setTokenRPCWeb3] start, rpc : ${jsonRPC}, token: ${tokenRPC}`)

    // if(batchTransferAddress) {
    //     batchTransferContract = new web3.eth.Contract(BatchTransferABI, batchTransferAddress, {
    //         gasPrice: '20000000000'
    //     })
    // }


    // web3.eth.signTransaction({
    //     from: walletAddress,
    //     gasPrice: "20000000000",
    //     gas: "21000",
    //     to: batchTransferAddress,
    //     value: "1000000000000000000",
    //     data: ""
    // })
}

export function setWeb3(jsonRPC: string, tokenRPC: TokenName) {
    web3.set(tokenRPC, new Web3(jsonRPC))
}

function setWalletInfo(walletAddress: string, walletPrivate: string, tokenRPC: TokenName) {
    // web3.eth.accounts.privateKeyToAccount(walletPrivate)

    web3.get(tokenRPC).eth.accounts.wallet.add(walletPrivate)
    web3.get(tokenRPC).eth.defaultAccount = walletAddress

    logger.info(web3.get(tokenRPC).eth.defaultAccount)
}

export function getTokenAmount(amount: string, tokenRPC: TokenName = TokenName.ETH, tokenCount: string = 'ether'): bigint {
    return BigInt(String((web3.get(tokenRPC)).utils.toWei(amount, tokenCount)))
}

export async function sendToken(id: string, tokenAddress: string, amount: number, toAddress: string, tokenRPC: TokenName): Promise<{ error: string; transactionHash: string; }> {
    const web3Token = web3.get(tokenRPC)
    const token = tokenContracts.has(tokenAddress) ?
        tokenContracts.get(tokenAddress) : new web3Token.eth.Contract(ERC20ABI, tokenAddress)

    tokenContracts.set(tokenAddress, token)

    const tokenAmount = web3Token.utils.toWei(amount, 'ether')

    try {

        const gasPrice = await web3Token.eth.getGasPrice()
        const gasLimit = await token.methods.transfer(toAddress, tokenAmount).estimateGas({ from: fromWalletAddress })
        // const gasTotal = gasPrice * gasAmount
        logger.info(`[sendToken] GAS LIMIT : ${gasLimit} GASPRICE : ${gasPrice}`)


        const result = await token.methods.transfer(toAddress, tokenAmount).send({
            from: fromWalletAddress,
            gasPrice: gasPrice,
            gasLimit: gasLimit
        })

        logger.info(`[sendToken] Complete. tokenAddress : ${tokenAddress}. toAddress : ${toAddress}. amount : ${tokenAmount}`)
        // 거래 보냄 -> 블록 체결 까지 확인 필요
        return { error: null, transactionHash: result.transactionHash as string }
    }
    catch (error: any) {
        logger.error(`[sendToken][${id}] toAddress : ${toAddress} Error : ${error}`)
        return { error: error as string, transactionHash: null }
    }
}

export async function sendEth(id: string, amount: number, toAddress: string, tokenRPC: TokenName): Promise<{ error: string; transactionHash: string; }> {
    const web3Token = web3.get(tokenRPC)

    //Wei to Ether (전달받은 amount 를 그대로 이더로 변환)
    const tokenAmount = web3Token.utils.toWei(amount, 'ether')
    try {
        const gasPrice = await web3Token.eth.getGasPrice()
        const gasLimit = await web3Token.eth.estimateGas({
            to: toAddress,
            from: fromWalletAddress,
            value: tokenAmount
        })

        // const gasTotal = gasPrice * gasAmount
        logger.info(`[sendEth] gasLimit : ${gasLimit} GASPRICE : ${gasPrice}`)

        const result = await web3Token.eth.sendTransaction({
            from: fromWalletAddress,
            to: toAddress,
            data: '0x',
            value: tokenAmount,
            gasPrice: gasPrice,
            gasLimit: gasLimit
        })

        logger.info(`[sendEth] Complete. tokenRPC : ${tokenRPC}. toAddress : ${toAddress}. amount : ${tokenAmount}`)

        return { error: null, transactionHash: result.transactionHash as string }
    } catch (error: any) {
        {
            logger.error(`[sendEth][${id}] Error : ${error}`)
            return { error: error as string, transactionHash: null }
        }

    }
}


// async function sendEthersAndTokensByContract(infos: sendTokenInfo[]): Promise<resultHashInfo[]> {
//     const etherWallets = []
//     const etherAmounts = []
//     const etherIds = []
//     const result: resultHashInfo[] = []

//     const tokenInfos = new Map<string, resultHashInfo[]>()

//     let etherTotalAmount = 0

//     for (const value of infos) {
//         if (value.tokenName === TokenName.ETH) {
//             etherWallets.push(value.address)

//             //Wei to Ether (전달받은 amount 를 그대로 이더로 변환)
//             const amount = web3.utils.toWei(value.amount, 'ether')
//             etherAmounts.push(amount)
//             etherTotalAmount += Number(amount)
//             etherIds.push(value.id)
//         } else {
//             if (tokenInfos.has(value.tokenAddress)) {
//                 tokenInfos.get(value.tokenAddress).push({
//                     id: value.id,
//                     wallet: value.address,
//                     amount: value.amount,
//                     from: fromWalletAddress
//                 })
//             } else {
//                 tokenInfos.set(value.tokenAddress, [{
//                     id: value.id,
//                     wallet: value.address,
//                     amount: value.amount,
//                     from: fromWalletAddress
//                 }])
//             }
//         }
//     }

//     //eth 전송
//     let resultEth = null
//     try {
//         resultEth = await batchTransferContract.methods.batchTransfer(etherWallets, etherAmounts).send({
//             gasPrice: '20000000000',
//             from: fromWalletAddress,
//             gas: 500_0000,
//             value: etherTotalAmount
//         })

//         result.push({id: etherIds, error: null, transactionHash: resultEth.transactionHash})
//     } catch (error: any) {
//         logger.error(`[ByContract][${etherIds}] ETH Error ${error}`)
//         result.push({id: etherIds, error: error as string, transactionHash: resultEth.transactionHash})
//     }


//     //token approve
//     for (const infos of tokenInfos) {
//         const key = infos[0]

//         let totalAmount = 0
//         for (const info of infos[1]) {
//             const amount = web3.utils.toWei(info.tokenAddress, 'ether')
//             totalAmount += Number(amount)
//         }

//         const token = tokenContracts.has(key) ?
//             tokenContracts.get(key) : new web3.eth.Contract(ERC20ABI, key)

//         tokenContracts.set(key, token)

//         const approveResult = await token.methods.approve(batchTransferContract._address, totalAmount.toString()).send({
//             from: infos[1][0].from,
//             gas: 50_0000,
//         });
//     }


//     const notEthInfos = infos.filter((value) => {
//         return !isEther(value.token)
//     })
//     if (notEthInfos.length === 0) {
//         return result
//     }
//     const tokenAddresses = notEthInfos.map((value) => {
//         return value.token
//     })
//     const toAddresses = notEthInfos.map((value) => {
//         return value.address
//     })
//     const toAmounts = notEthInfos.map((value) => {
//         return web3.utils.toWei(value.amount, 'ether')
//     })
//     const fromAddresses = initArray_BySameValue(notEthInfos.length, fromWalletAddress)
//     const erc20Ids = notEthInfos.map((value) => {
//         return value.id
//     })

//     let resultERC20 = null
//     try {
//         //token transfer
//         resultERC20 = await batchTransferContract.methods.batchTransferERC20(tokenAddresses, toAddresses, toAmounts, fromAddresses).send({
//             from: fromWalletAddress,
//             gas: 50_0000,
//         });
//         result.push({id: erc20Ids, error: null, transactionHash: resultERC20.transactionHash})
//     } catch (error) {
//         logger.error(`[ByContract][${erc20Ids}] ERC20 Error ${error}`)
//         result.push({id: erc20Ids, error: error as string, transactionHash: resultERC20.transactionHash})
//     }


//     return result
// }


export function createRandomAccount(tokenRPC: TokenName = TokenName.ETH) {
    const account = (web3.get(tokenRPC)).eth.accounts.create((web3.get(tokenRPC)).utils.randomHex(32))
    logger.info(JSON.stringify(account, null, 4))
}

export async function getEthBalance(address: string, tokenRPC: TokenName = TokenName.ETH): Promise<bigint> {
    const balance = BigInt((await (web3.get(tokenRPC)).eth.getBalance(address)).toString())
    return balance
}

export async function getTokenBalance(walletAddress: string, tokenAddress: string, tokenRPC: TokenName = TokenName.ETH): Promise<bigint> {
    const web3Token = (web3.get(tokenRPC))
    const token = tokenContracts.has(tokenAddress) ?
        tokenContracts.get(tokenAddress) : new web3Token.eth.Contract(ERC20ABI, tokenAddress)
    tokenContracts.set(tokenAddress, token)

    const balance = BigInt((await token.methods.balanceOf(walletAddress).call()).toString())
    return balance
}

