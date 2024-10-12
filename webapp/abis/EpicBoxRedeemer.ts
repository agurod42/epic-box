// @ts-nocheck
export const abi = [
  {
    "type": "constructor",
    "name": "",
    "inputs": [
      {
        "type": "address",
        "name": "_epicBoxAddress",
        "internalType": "address"
      },
      {
        "type": "address",
        "name": "_packAddress",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "EpicBoxRedeemed",
    "inputs": [
      {
        "type": "address",
        "name": "user",
        "indexed": true,
        "internalType": "address"
      },
      {
        "type": "uint256",
        "name": "ticketId",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "type": "uint256",
        "name": "packId",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "type": "tuple[]",
        "name": "rewardUnits",
        "components": [
          {
            "type": "address",
            "name": "assetContract",
            "internalType": "address"
          },
          {
            "type": "uint8",
            "name": "tokenType",
            "internalType": "enum ITokenBundle.TokenType"
          },
          {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256"
          },
          {
            "type": "uint256",
            "name": "totalAmount",
            "internalType": "uint256"
          }
        ],
        "indexed": false,
        "internalType": "struct ITokenBundle.Token[]"
      }
    ],
    "outputs": [],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "epicBox",
    "inputs": [],
    "outputs": [
      {
        "type": "address",
        "name": "",
        "internalType": "contract IERC721"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onERC721Received",
    "inputs": [
      {
        "type": "address",
        "name": "",
        "internalType": "address"
      },
      {
        "type": "address",
        "name": "",
        "internalType": "address"
      },
      {
        "type": "uint256",
        "name": "",
        "internalType": "uint256"
      },
      {
        "type": "bytes",
        "name": "",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "type": "bytes4",
        "name": "",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pack",
    "inputs": [],
    "outputs": [
      {
        "type": "address",
        "name": "",
        "internalType": "contract IPack"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "redeemTicket",
    "inputs": [
      {
        "type": "uint256",
        "name": "ticketId",
        "internalType": "uint256"
      },
      {
        "type": "uint256",
        "name": "packId",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
]