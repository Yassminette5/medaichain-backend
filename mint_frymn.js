require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-amoy.drpc.org';
  const privateKey = process.env.NFT_MINTER_PRIVATE_KEY;
  const contractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
  const pharmacyAddress = '0xeBb2e61F63C1491464A5cA9b7d6c7D7Cae818106';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = ["function mint(address to, uint256 amount) public"];
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log('Minting 50 FRYMN to pharmacy...');
  const amount = ethers.parseUnits('50', 18);
  const tx = await contract.mint(pharmacyAddress, amount);
  console.log('Tx sent:', tx.hash);
  await tx.wait();
  console.log('Tx confirmed!');
}

main().catch(console.error);
