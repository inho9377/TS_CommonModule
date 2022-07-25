import { logger } from "../Winston-Logger";
import {initArray_BySameValue} from "../Array";

const Web3 = require('web3')

const ERC20ABI = require('../../../abi/ERC20.abi.json')
const BatchTransferABI = require('../../../abi/BatchTransfer.abi.json')

let web3
const tokenContracts = new Map<string, any>()
let batchTransferContract
let fromWalletAddress



export function start_eth(walletAddress: string, walletPrivate: string, batchTransferAddress: string, jsonRPC: string) {
    setWeb3(jsonRPC)

    setWalletInfo(walletAddress, walletPrivate)
    fromWalletAddress = walletAddress

    if(batchTransferAddress) {
        batchTransferContract = new web3.eth.Contract(BatchTransferABI, batchTransferAddress, {
            gasPrice: '20000000000'
        })
    }


    // web3.eth.signTransaction({
    //     from: walletAddress,
    //     gasPrice: "20000000000",
    //     gas: "21000",
    //     to: batchTransferAddress,
    //     value: "1000000000000000000",
    //     data: ""
    // })
}

export function setWeb3(jsonRPC: string) {
    web3 = new Web3(jsonRPC)
}

function setWalletInfo(walletAddress: string, walletPrivate: string) {
    // web3.eth.accounts.privateKeyToAccount(walletPrivate)

    web3.eth.accounts.wallet.add(walletPrivate)
    web3.eth.defaultAccount = walletAddress
}

export async function sendToken(id: string, tokenAddress: string, amount: number, toAddress: string): Promise<{ error: string; transactionHash: string; }> {
    const token = tokenContracts.has(tokenAddress) ?
        tokenContracts.get(tokenAddress) : new web3.eth.Contract(ERC20ABI, tokenAddress)

    tokenContracts.set(tokenAddress, token)

    const tokenAmount = web3.utils.toWei(amount, 'ether')

    try {
        const result = await token.methods.transfer(toAddress, tokenAmount).send({
            from: fromWalletAddress,
            gas: 100_0000
        })
        // 거래 보냄 -> 블록 체결 까지 확인 필요
        return { error: null, transactionHash: result.transactionHash as string }
    }
    catch (error: any) {
        logger.error(`[sendToken][${id}] toAddress : ${toAddress} Error : ${error}`)
        return { error: error as string, transactionHash: null }
    }
}

export async function sendEth(id: string, amount: number, toAddress: string): Promise<{ error: string; transactionHash: string; }> {
    //Wei to Ether (전달받은 amount 를 그대로 이더로 변환)
    const tokenAmount = web3.utils.toWei(amount, 'ether')
    try {
        const result = await web3.eth.sendTransaction({
            from: fromWalletAddress,
            to: toAddress,
            data: '0x',
            value: tokenAmount,
            gas: 100_0000
        })

        return {error: null, transactionHash: result.transactionHash as string}
    } catch (error: any) {
        {
            logger.error(`[sendEth][${id}] Error : ${error}`)
            return {error: error as string, transactionHash: null}
        }

    }
}

function isEther(token: string): boolean {
    return token === '0'
}

async function sendEthersAndTokensByContract(infos: { id: string, address: string, token: string, amount: number }[]): Promise<{ id: string[]; error: string; transactionHash: string; }[]> {
    const etherWallets = []
    const etherAmounts = []
    const etherIds = []
    const result: { id: string[]; error: string; transactionHash: string; }[] = []

    const tokenInfos = new Map<string, { id: string, wallet: string, amount: number, from: string }[]>()

    let etherTotalAmount = 0

    for (const value of infos) {
        if (isEther(value.token)) {
            etherWallets.push(value.address)

            //Wei to Ether (전달받은 amount 를 그대로 이더로 변환)
            const amount = web3.utils.toWei(value.amount, 'ether')
            etherAmounts.push(amount)
            etherTotalAmount += Number(amount)
            etherIds.push(value.id)
        } else {
            if (tokenInfos.has(value.token)) {
                tokenInfos.get(value.token).push({
                    id: value.id,
                    wallet: value.address,
                    amount: value.amount,
                    from: fromWalletAddress
                })
            } else {
                tokenInfos.set(value.token, [{
                    id: value.id,
                    wallet: value.address,
                    amount: value.amount,
                    from: fromWalletAddress
                }])
            }
        }
    }

    //eth 전송
    let resultEth = null
    try {
        resultEth = await batchTransferContract.methods.batchTransfer(etherWallets, etherAmounts).send({
            gasPrice: '20000000000',
            from: fromWalletAddress,
            gas: 500_0000,
            value: etherTotalAmount
        })

        result.push({id: etherIds, error: null, transactionHash: resultEth.transactionHash})
    } catch (error: any) {
        logger.error(`[ByContract][${etherIds}] ETH Error ${error}`)
        result.push({id: etherIds, error: error as string, transactionHash: resultEth.transactionHash})
    }


    //token approve
    for (const infos of tokenInfos) {
        const key = infos[0]

        let totalAmount = 0
        for (const info of infos[1]) {
            const amount = web3.utils.toWei(info.amount, 'ether')
            totalAmount += Number(amount)
        }

        const token = tokenContracts.has(key) ?
            tokenContracts.get(key) : new web3.eth.Contract(ERC20ABI, key)

        tokenContracts.set(key, token)

        const approveResult = await token.methods.approve(batchTransferContract._address, totalAmount.toString()).send({
            from: infos[1][0].from,
            gas: 50_0000,
        });
    }


    const notEthInfos = infos.filter((value) => {
        return !isEther(value.token)
    })
    if (notEthInfos.length === 0) {
        return result
    }
    const tokenAddresses = notEthInfos.map((value) => {
        return value.token
    })
    const toAddresses = notEthInfos.map((value) => {
        return value.address
    })
    const toAmounts = notEthInfos.map((value) => {
        return web3.utils.toWei(value.amount, 'ether')
    })
    const fromAddresses = initArray_BySameValue(notEthInfos.length, fromWalletAddress)
    const erc20Ids = notEthInfos.map((value) => {
        return value.id
    })

    let resultERC20 = null
    try {
        //token transfer
        resultERC20 = await batchTransferContract.methods.batchTransferERC20(tokenAddresses, toAddresses, toAmounts, fromAddresses).send({
            from: fromWalletAddress,
            gas: 50_0000,
        });
        result.push({id: erc20Ids, error: null, transactionHash: resultERC20.transactionHash})
    } catch (error) {
        logger.error(`[ByContract][${erc20Ids}] ERC20 Error ${error}`)
        result.push({id: erc20Ids, error: error as string, transactionHash: resultERC20.transactionHash})
    }


    return result
}

async function sendEthersAndTokensByScript(infos: { id: string, address: string, token: string, amount: number }[]): Promise<{ id: string[]; error: string; transactionHash: string; }[]> {
    const result: { id: string[], error: string; transactionHash: string; }[] = []
    for (const value of infos) {
        if (isEther(value.token)) {
            const ethResult = await sendEth(value.id, value.amount, value.address)
            result.push({id: [value.id], error: ethResult.error, transactionHash: ethResult.transactionHash})
        } else {
            const tokenResult = await sendToken(value.id, value.token, value.amount, value.address)
            result.push({id: [value.id], error: tokenResult.error, transactionHash: tokenResult.transactionHash})
        }
    }

    return result;
}


export async function sendEthersAndTokens(infos: { id: string, address: string, token: string, amount: number }[], sendByContracts: boolean): Promise<{ id: string[], error: string; transactionHash: string; }[]> {
    if (sendByContracts) {
        return await sendEthersAndTokensByContract(infos)
    } else {
        return await sendEthersAndTokensByScript(infos)
    }
}

export function createRandomAccount() {
    const account = web3.eth.accounts.create(web3.utils.randomHex(32))
    logger.info(account)
}


