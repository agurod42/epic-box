import { Chain } from "@thirdweb-dev/chains";

export const Matchain: Chain = {
  "chain": "Matchain",
  "chainId": 698,
  "explorers": [
    {
      "name": "blockscout",
      "url": "https://matchscan.io",
      "standard": "EIP3091",
      "icon": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMrM9PvMofNez2rIJdxCpCMyT3uJj6SO69FQ&s",
        "width": 225,
        "height": 225,
        "format": "png"
      }
    }
  ],
  "faucets": [],
  "icon": {
    "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMrM9PvMofNez2rIJdxCpCMyT3uJj6SO69FQ&s",
    "width": 225,
    "height": 225,
    "format": "png"
  },
  "infoURL": "https://matchscan.io",
  "name": "Matchain",
  "nativeCurrency": {
    "name": "BNB",
    "symbol": "BNB",
    "decimals": 18
  },
  "networkId": 698,
  "rpc": [
    "https://698.rpc.thirdweb.com/${THIRDWEB_API_KEY}",
    "https://rpc.ankr.com/matchain_mainnet",
  ],
  "shortName": "matchain",
  "slug": "matchain",
  "testnet": false
};