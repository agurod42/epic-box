// This script mints a specified number of tokens to a given recipient address using the Ethereum blockchain.
// Usage: node mintEpicBoxes.js <chain> <recipient_address> <amount>

const fs = require('fs');
const readline = require('readline');
const { ethers } = require('ethers');

// Constants
const CHAINS = {
  boba: {
    name: 'Boba Network',
    symbol: 'ETH',
    rpc: 'https://mainnet.boba.network',
    contractAddress: '0x5d8963198C66BEDa41Fcbc9485323FaC749Dc38C',
  },
  matchain: {
    name: 'Matchain',
    symbol: 'BNB',
    rpc: 'https://rpc.ankr.com/matchain_mainnet',
    contractAddress: '0x47120974eaa4D7AE806c9DD5fbAAC823B18419FC',
  },
  polygon: {
    name: 'Polygon',
    symbol: 'POL',
    rpc: 'https://orbital-chaotic-mound.matic.quiknode.pro/c2c3bc5e54a59e13f0eac38b8e0d48ad7c790056',
    contractAddress: '0xB7F21E3A4B2B3fD8b897201a2Fb47A973c8E5A2c',
  },
  xdc: {
    name: 'XDC', 
    symbol: 'XDC',
    rpc: 'https://earpc.xinfin.network',
    contractAddress: '0x331936B75f6ebC061723e30B3A9AbD692d1cD460'
  }
};

const PRIVATE_KEY_FILE = 'privateKey.txt';
const TOKEN_URI = 'QmUz5hyETCGgd4xpFQvksi7JKGLEw684FxgYipfzTGHoTp';
const WALLET_MIN_BALANCE = ethers.utils.parseEther('0.0001');

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
    "name": "mintTo",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    console.error('Usage: node mintEpicBoxes.js <chain> <recipient_address> <amount>');
    console.error('Supported chains: polygon, xdc');
    process.exit(1);
  }

  const chainArg = args[0].toLowerCase();
  const recipientAddress = args[1];
  const amount = parseInt(args[2], 10);

  if (!CHAINS[chainArg]) {
    console.error('Invalid chain. Supported chains: polygon, xdc');
    process.exit(1);
  }

  const chain = CHAINS[chainArg];

  if (!ethers.utils.isAddress(recipientAddress)) {
    console.error('Invalid recipient address.');
    process.exit(1);
  }

  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid amount. Please enter a positive integer.');
    process.exit(1);
  }

  const privateKey = await getPrivateKey();
  const provider = new ethers.providers.JsonRpcProvider(chain.rpc);
  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);
  const contract = new ethers.Contract(chain.contractAddress, ABI, signer);

  // Check wallet balance
  const balance = await signer.getBalance();
  if (balance.lt(WALLET_MIN_BALANCE)) {
    console.error(`Insufficient balance. Minimum required: ${WALLET_MIN_BALANCE / 10 ** 18} ${chain.symbol}. Remember to add some ${chain.symbol} to ${wallet.address} to cover the gas fees.`);
    process.exit(1);
  }

  const tokenUri = chainArg === 'polygon' ? TOKEN_URI : `https://ipfs.io/ipfs/${TOKEN_URI}`;

  console.log(`Chain: ${chain.name}`);
  console.log(`Contract Address: ${chain.contractAddress}`);
  console.log(`Minting ${amount} token(s) to: ${recipientAddress}`);
  console.log(`Using tokenURI: ${tokenUri}`);

  try {
    const gasPrice = await provider.getGasPrice();

    for (let i = 0; i < amount; i++) {
      const mintFunction = chainArg === 'polygon' ? 'safeMint' : 'mintTo';
      const estimatedGasLimit = chainArg === 'polygon' 
        ? await contract.estimateGas.safeMint(recipientAddress, tokenUri)
        : 300000;

      const tx = await contract[mintFunction](recipientAddress, tokenUri, {
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