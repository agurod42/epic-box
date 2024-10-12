# MetaSoccer Epic Boxes

MetaSoccer Epic Boxes are a limited collection of 1000 NFTs, each containing secret gifts.

## Smart Contract

The [MetaSoccer Epic Boxes smart contract](https://polygonscan.com/address/0xB7F21E3A4B2B3fD8b897201a2Fb47A973c8E5A2c#code) implements [Thirdweb's NFT contract](https://portal.thirdweb.com/contracts/explore/pre-built-contracts/nft-collection). The metadata is hosted on IPFS and is immutable, except for the image, which is hosted on MetaSoccer's servers.

## Fair Distribution

To ensure fair distribution of the epic boxes, we use [Thirdweb's Pack Smart Contract](https://portal.thirdweb.com/contracts/design-docs/pack) to create openable loot boxes containing MetaSoccer Epic Boxes NFTs (Epic Box Packs). Each Epic Box Pack contains one MetaSoccer Epic Box NFT.

Each Epic Box Ticket grants the user the right to redeem one Epic Box Pack via the [EpicBoxRedeemer.sol smart contract](onchain/contracts/EpicBoxRedeemer.sol). This smart contract receives the MetaSoccer Epic Box Ticket NFT, burns it, and transfers one MetaSoccer Epic Box Pack NFT to the user. The webapp streamlines this process by opening the Epic Box Pack NFT once it is received.

## Developer Guide

### Creating Packs

1. Make sure to transfer assets (lands, players, scouts) to the pack creator (0x37BE501947F0f01504BDFE915ef716FF36390eef).

2. Call `bundleTokens.mjs` (`cd onchain && yarn run bundle-tokens`) to bundle the tokens into packs.

3. Transfer packs to the EpicBoxRedeemer contract to allow for redemptions. You can go to the [thirdweb dashboard](https://thirdweb.com/polygon/0x019C38026dE05862ef332cf5A17f245876D15674/nfts/0) to do this.

### Deploying

The application is currently [deployed on Vercel](https://vercel.com/meta-soccer/epic-box). To update the deployment, sync the [repository fork](https://github.com/agurod42/epic-box/tree/main).