const ethers = require('ethers');

export function createRandomAccount() {
    const entropy = ethers.utils.randomBytes(16);  // or 32
    const mnemonic = ethers.utils.entropyToMnemonic(entropy);
    console.log(mnemonic);

    const wallets = [];
    const maxIdx = 10;
    for (let i = 0; i < maxIdx; i++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
        wallets.push({
            address: wallet.address,
            privateKey: wallet.privateKey,
        });
    }

    console.table(wallets);
}
