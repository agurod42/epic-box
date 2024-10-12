import dotenv from "dotenv";
dotenv.config();

import { ThirdwebSDK } from "@thirdweb-dev/sdk";

const REWARDS_PER_PACK = 3;

(async () => {
  try {
    const packContractAddress = "0x019C38026dE05862ef332cf5A17f245876D15674";

    const playerContractAddress = "0x6f5D7bA06aD7B28319d86fceC09fae5bbC83d32F";
    const scoutContractAddress = "0x94E42811Db93EF7831595b6fF9360491B987DFbD";
    const landContractAddress = "0x5b40f62fE5Dd53Ec89D82D432c05B9eD79764C5A";

    console.log("Initializing SDKs...");
    const marketingSdk = ThirdwebSDK.fromPrivateKey(process.env.ASSET_HOLDER_PRIVATE_KEY, "polygon", {
      clientId: process.env.THIRDWEB_API_CLIENT_ID,
      secretKey: process.env.THIRDWEB_API_SECRET_KEY,
    });

    const packCreatorSdk = ThirdwebSDK.fromPrivateKey(process.env.THIRDWEB_PRIVATE_KEY, "polygon", {
      clientId: process.env.THIRDWEB_API_CLIENT_ID,
      secretKey: process.env.THIRDWEB_API_SECRET_KEY,
    });

    console.log("Fetching addresses...");
    const marketingAddress = await marketingSdk.deployer.getSigner().getAddress();
    const packCreatorAddress = await packCreatorSdk.deployer.getSigner().getAddress();

    console.log("Fetching contracts...");
    const marketingLandContract = await marketingSdk.getContract(landContractAddress, 'nft-collection');
    const marketingPlayerContract = await marketingSdk.getContract(playerContractAddress, 'nft-collection');
    const marketingScoutContract = await marketingSdk.getContract(scoutContractAddress, 'nft-collection');

    const packCreatorLandContract = await packCreatorSdk.getContract(landContractAddress, 'nft-collection');
    const packCreatorPlayerContract = await packCreatorSdk.getContract(playerContractAddress, 'nft-collection');
    const packCreatorScoutContract = await packCreatorSdk.getContract(scoutContractAddress, 'nft-collection');

    console.log("Setting approvals...");
    await packCreatorLandContract.setApprovalForAll(packContractAddress, true);
    await packCreatorPlayerContract.setApprovalForAll(packContractAddress, true);
    await packCreatorScoutContract.setApprovalForAll(packContractAddress, true);

    let erc721Rewards = [];

    const transferAndAddToRewards = async (contract, ownerAddress) => {
      console.log(`Transferring NFTs from contract: ${contract.getAddress()} for owner: ${ownerAddress}`);
      const nfts = await contract.getOwned(ownerAddress);
      const shouldTransfer = ownerAddress !== packCreatorAddress;
      for (const nft of nfts) {
        console.log(`Processing NFT with ID: ${nft.metadata.id}`);
        if (shouldTransfer) {
          await contract.transfer(packCreatorAddress, nft.metadata.id);
        }
        erc721Rewards.push({
          contractAddress: contract.getAddress(),
          tokenId: nft.metadata.id,
          quantityPerReward: 1,
          totalRewards: 1,
        });
      }
    };

    await transferAndAddToRewards(marketingLandContract, marketingAddress);
    await transferAndAddToRewards(marketingPlayerContract, marketingAddress);
    await transferAndAddToRewards(marketingScoutContract, marketingAddress);

    await transferAndAddToRewards(packCreatorLandContract, packCreatorAddress);
    await transferAndAddToRewards(packCreatorPlayerContract, packCreatorAddress);
    await transferAndAddToRewards(packCreatorScoutContract, packCreatorAddress);

    console.log("Creating packs now...");

    const packContract = await packCreatorSdk.getContract(packContractAddress, 'pack');

    const chunkSize = REWARDS_PER_PACK * 3;
    const packBalance = await packContract.balanceOf(packCreatorAddress, 0);

    for (let i = 0; i < erc721Rewards.length; i += chunkSize) {
      const chunk = erc721Rewards.slice(i, i + chunkSize);
      if (i === 0 && packBalance === 0) {
        console.log(`Creating initial pack with ${chunk.length} ERC721 rewards...`);
        await packContract.create({
          packMetadata: {
            name: "MetaSoccer Epic Box",
            description: "MetaSoccer Epic Boxes are a limited collection of 1000 NFTs, each containing secret gifts.",
            image: "https://ipfs.io/ipfs/QmRHEp1hS9pwt1jVNBMmyKgXvDeSqvrU8QVtbWpGKgMnZi",
          },
          erc721Rewards: chunk,
          rewardsPerPack: REWARDS_PER_PACK,
        });
      } else if (chunk.length % REWARDS_PER_PACK === 0) {
        console.log(`Adding chunk of ${chunk.length} ERC721 rewards to the pack...`);
        const packNfts = await packContract.addPackContents(0, { erc721Rewards: chunk });
        console.log(`Added chunk of ${chunk.length} ERC721 rewards to the pack.`);
        console.log(packNfts);
      } else {
        console.log(`Skipping chunk of ${chunk.length} ERC721 rewards as it's not a multiple of ${REWARDS_PER_PACK}`);
      }
    }

    console.log(`====== Success: Pack NFTs =====`);
  } catch (error) {
    console.error("An error occurred:", error.message ?? "Unknown error");
    throw new Error(error.message ?? "An error occurred during the pack creation process");
  }
})();