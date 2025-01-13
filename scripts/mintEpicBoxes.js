// This script mints a specified number of tokens to a given recipient address using the Ethereum blockchain.
// Usage: node mintEpicBoxes.js <recipient_address> <amount>

const fs = require('fs');
const readline = require('readline');
const { ethers } = require('ethers');

// Constants
const CONTRACT_ADDRESS = '0xB7F21E3A4B2B3fD8b897201a2Fb47A973c8E5A2c';
const PRIVATE_KEY_FILE = 'privateKey.txt';
const TOKEN_URI = 'QmUz5hyETCGgd4xpFQvksi7JKGLEw684FxgYipfzTGHoTp';
const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "safeMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Function to get private key
async function getPrivateKey() {
  if (fs.existsSync(PRIVATE_KEY_FILE)) {
    return fs.readFileSync(PRIVATE_KEY_FILE, 'utf8').trim();
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const privateKey = await new Promise((resolve) => {
      rl.question('Enter your private key: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    fs.writeFileSync(PRIVATE_KEY_FILE, privateKey, { encoding: 'utf8', flag: 'w' });
    console.log('Private key saved to file.');
    return privateKey;
  }
}

// Main function to mint the token
async function main() {
  const privateKey = await getPrivateKey();
  const provider = new ethers.providers.JsonRpcProvider('https://orbital-chaotic-mound.matic.quiknode.pro/c2c3bc5e54a59e13f0eac38b8e0d48ad7c790056');
  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: node mintEpicBoxes.js <recipient_address> <amount>');
    process.exit(1);
  }

  const recipientAddress = args[0];
  const amount = parseInt(args[1], 10);

  if (!ethers.utils.isAddress(recipientAddress)) {
    console.error('Invalid recipient address.');
    process.exit(1);
  }

  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid amount. Please enter a positive integer.');
    process.exit(1);
  }

  console.log(`Minting ${amount} token(s) to: ${recipientAddress}`);
  console.log(`Using tokenURI: ${TOKEN_URI}`);

  try {
    const gasPrice = await provider.getGasPrice();
    for (let i = 0; i < amount; i++) {
      const estimatedGasLimit = await contract.estimateGas.safeMint(recipientAddress, TOKEN_URI);
      const tx = await contract.safeMint(recipientAddress, TOKEN_URI, {
        gasPrice: gasPrice,
        gasLimit: estimatedGasLimit
      });
      console.log(`Transaction ${i + 1} sent. Hash:`, tx.hash);

      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log(`Transaction ${i + 1} confirmed. Receipt:`, receipt);
    }
    console.log('Minting successful!');
  } catch (error) {
    console.error('Error minting token:', error.message ?? 'Unknown error', error);
  }
}

main();