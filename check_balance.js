const { ethers } = require('ethers');
async function checkBalance() {
  const rpcUrl = 'https://rpc-amoy.polygon.technology/';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet('232001023d6b1ceb9b8b7361e8e603e4d92cafe1fc975b80dc35a87ae1592245', provider);
  const balance = await provider.getBalance(wallet.address);
  console.log('Address:', wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'POL');
}
checkBalance().catch(console.error);
