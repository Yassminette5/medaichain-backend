const { ethers } = require('ethers');
const TOKEN_ABI = ['function balanceOf(address) view returns (uint256)'];
async function check() {
  const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology/');
  const tokenAddress = '0x6d80048192BA1CB7fC953Ed44E7F9da2f3b9ec1e';
  const pharmacyWallet = '0xeBb2e61F63C1491464A5cA9b7d6c7D7Cae818106';
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  const balance = await contract.balanceOf(pharmacyWallet);
  console.log('Pharmacy wallet:', pharmacyWallet);
  console.log('On-chain FRYMN balance (raw):', balance.toString());
  console.log('On-chain FRYMN balance (human):', ethers.formatUnits(balance, 18));
}
check().catch(console.error);
