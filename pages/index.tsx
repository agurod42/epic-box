import { ChainName, networkConfig } from "@0xfutbol/constants";
import {
  ConnectEmbed,
  ConnectWallet,
  NFT,
  ThirdwebNftMedia,
  useAddress,
  useChainId,
  useContract,
  useNFT,
  useOwnedNFTs,
  Web3Button
} from "@thirdweb-dev/react";
import axios from "axios";
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import type { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Zoom } from "react-awesome-reveal";
import ConfettiExplosion from "react-confetti-explosion";
import { useDeepCompareEffect } from "react-use";

import { abi as epicBoxOpenerAbi } from "../abis/EpicBoxOpener";

import styles from "../styles/Home.module.css";

// Contract addresses by chain
const CONTRACT_ADDRESSES = {
  50: { // XDC mainnet
    LAND: "0x11D966323b04EA27318780FA5e2a0344F1Acc4C6",
    PLAYER: "0x57dBF78C912a67aF7D170F1a247385AeA8E2D15B",
    SCOUT: "0x2983a8654d3923f4ABADA00331865c9C06B5AaB4",
    OPENER: "0x15c1af32541F0AcC4fBD2012407599Bbec6Fd8e4",
    EPIC_BOX: "0x331936B75f6ebC061723e30B3A9AbD692d1cD460"
  },
  137: { // Polygon
    LAND: "0x1C80e3D799eBf28E47C488EcdABd7ea47B5d8595",
    PLAYER: "0x6f5D7bA06aD7B28319d86fceC09fae5bbC83d32F",
    SCOUT: "0x94E42811Db93EF7831595b6fF9360491B987DFbD",
    OPENER: "0x312cC0B8e2b2F81cef459f40F821fcDda6Ab4e67",
    EPIC_BOX: "0xB7F21E3A4B2B3fD8b897201a2Fb47A973c8E5A2c"
  }
};

// Interface for EpicBoxOpener
const epicBoxOpenerInterface = new Interface(epicBoxOpenerAbi);

// Helper functions
const getAssetType = (contractAddress: string, chainId: number) => {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) return "Unknown";

  switch (contractAddress) {
    case addresses.LAND:
      return "Land";
    case addresses.PLAYER:
      return "Player";
    case addresses.SCOUT:
      return "Scout";
    default:
      return "Unknown";
  }
};

const getChainName = (chainId: number): ChainName => {
  if (chainId === 137) {
    return "polygon";
  } else if (chainId === 50) {
    return "xdc";
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
};

const getOpenSeaLink = (chainId: number, contractAddress: string, tokenId: string) => {
  if (chainId === 137) {
    return `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;
  } else if (chainId === 50) {
    return `https://xdcscan.com/nft/${contractAddress}/${tokenId}`;
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
};

const getPlayer = async (chainName: ChainName, nftTokenId: number): Promise<any> => {
  const query = `
    {
      players(where: { id_eq: "${nftTokenId}" }) {
        id
        owner
        blockHash
        transactionIndex
      }
    }
  `;

  const response = await axios.post(
    `${networkConfig[chainName].blockchainSquidEndpoint}/api/graphql`,
    { query }
  );
  const playerEntities: any[] = response.data.data.players;

  if (playerEntities.length === 0) {
    throw new Error(
      `No player entity found for player with token ID ${nftTokenId} on chain ${chainName}.`
    );
  }

  if (playerEntities.length > 1) {
    throw new Error(
      `Multiple player entities found for player with token ID ${nftTokenId} on chain ${chainName}.`
    );
  }

  return playerEntities[0];
};

const getScout = async (chainName: ChainName, nftTokenId: number): Promise<any> => {
  const query = `
    {
      scouts(where: { id_eq: "${nftTokenId}" }) {
        id
        owner
        blockHash
        transactionIndex
      }
    }
  `;

  const response = await axios.post(
    `${networkConfig[chainName].blockchainSquidEndpoint}/api/graphql`,
    { query }
  );
  const scoutEntities: any[] = response.data.data.scouts;

  if (scoutEntities.length === 0) {
    throw new Error(
      `No scout entity found for scout with token ID ${nftTokenId} on chain ${chainName}.`
    );
  }

  if (scoutEntities.length > 1) {
    throw new Error(
      `Multiple scout entities found for scout with token ID ${nftTokenId} on chain ${chainName}.`
    );
  }

  return scoutEntities[0];
};

const fetchPlayerWithRetry = async (
  chainName: ChainName,
  nftTokenId: number,
  retries = 90,
  delay = 1000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const playerFromSquid = await getPlayer(chainName, nftTokenId);
      console.log("Player data:", playerFromSquid);
      await syncPlayer(chainName, nftTokenId);
      return playerFromSquid;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed: ${error.message ?? "Unknown error"}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed to fetch player after ${retries} attempts`);
};

const fetchScoutWithRetry = async (
  chainName: ChainName,
  nftTokenId: number,
  retries = 90,
  delay = 1000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const scoutFromSquid = await getScout(chainName, nftTokenId);
      console.log("Scout data:", scoutFromSquid);
      await syncScout(chainName, nftTokenId);
      return scoutFromSquid;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed: ${error.message ?? "Unknown error"}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed to fetch player after ${retries} attempts`);
};

const syncPlayer = async (chainName: ChainName, playerNftId: number): Promise<void> => {
  try {
    await axios.post(
      "https://play.metasoccer.com/api/2024/blockchain/syncPlayer",
      {
        chainName,
        playerNftId,
      },
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3 seconds before returning
  } catch (error: any) {
    throw new Error(error.message ?? "Failed to sync player");
  }
};

const syncScout = async (chainName: ChainName, scoutNftId: number): Promise<void> => {
  try {
    await axios.post(
      "https://play.metasoccer.com/api/2024/blockchain/syncScout",
      {
        chainName,
        scoutNftId,
      },
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3 seconds before returning
  } catch (error: any) {
    console.error("Error syncing scout:", error.message ?? "Unknown error");
    throw new Error(error.message ?? "Failed to sync scout");
  }
};

const Home: NextPage = () => {
  const address = useAddress();
  const chainId = useChainId();

  const [isOpening, setIsOpening] = useState(false);
  const [redeemableNfts, setRedeemableNfts] = useState<NFT[]>([]);
  const [rewards, setRewards] = useState<Array<{ tokenId: string; contractAddress: string }> | null>(
    null
  );

  const addresses = chainId ? CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] : null;

  // Contracts
  const { contract: epicBoxContract } = useContract(
    addresses?.EPIC_BOX,
    "nft-collection"
  );
  const { contract: landContract } = useContract(addresses?.LAND, "nft-collection");
  const { contract: playerContract } = useContract(addresses?.PLAYER, "nft-collection");
  const { contract: scoutContract } = useContract(addresses?.SCOUT, "nft-collection");

  const contractMap = addresses ? {
    [addresses.LAND]: landContract,
    [addresses.PLAYER]: playerContract,
    [addresses.SCOUT]: scoutContract,
  } : {};

  // Data fetching
  const { data: epicBoxes = [], isLoading: isLoadingEpicBoxes } = useOwnedNFTs(
    epicBoxContract,
    address
  );
  const { data: reward1Nft } = useNFT(
    contractMap[rewards?.[0]?.contractAddress as keyof typeof contractMap],
    rewards?.[0]?.tokenId
  );
  const { data: reward2Nft } = useNFT(
    contractMap[rewards?.[1]?.contractAddress as keyof typeof contractMap],
    rewards?.[1]?.tokenId
  );
  const { data: reward3Nft } = useNFT(
    contractMap[rewards?.[2]?.contractAddress as keyof typeof contractMap],
    rewards?.[2]?.tokenId
  );

  const isLoading = isLoadingEpicBoxes;

  useEffect(() => {
    if (rewards && reward1Nft) {
      if (rewards.find((reward) => reward.tokenId === reward1Nft.metadata.id)) {
        console.log("Reward tokenId matches reward1Nft metadata id. Stopping opening process.");
        setIsOpening(false);
      }
    }
  }, [rewards, reward1Nft]);

  useDeepCompareEffect(() => {
    if (!isOpening) {
      console.log("Not opening. Setting redeemable NFTs.");
      setRedeemableNfts(epicBoxes);
    }
  }, [isOpening, epicBoxes]);

  if (!address) {
    console.log("No address found. Rendering ConnectEmbed.");
    return (
      <div className={styles.container} style={{ marginTop: 0 }}>
        <div className={styles.collectionContainer}>
          <ConnectEmbed showThirdwebBranding={false} />

          <div className={styles.footer}>Made with &lt;3 for MetaSoccer&apos;s community</div>

          <div className={styles.header}>
            <Image
              alt="MetaSoccer"
              src="https://assets.metasoccer.com/metasoccer-logo.svg"
              height={24}
              width={120}
              className={styles.logo}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!addresses) {
    return (
      <div className={styles.container}>
        <p>Please connect to a supported network (Polygon or Mumbai)</p>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ marginTop: 0 }}>
      <div className={styles.collectionContainer}>
        {!isLoading ? (
          (redeemableNfts?.length ?? 0) > 0 ? (
            <div className={styles.nftBoxGrid}>
              {redeemableNfts.map((nft, index) => (
                <div className={styles.nftBox} key={nft.metadata.id.toString()}>
                  <ThirdwebNftMedia
                    metadata={{
                      ...nft.metadata,
                      image: nft.metadata.image,
                    }}
                    className={styles.nftMedia}
                  />
                  <h3>{nft.metadata.name}</h3>

                  <Web3Button
                    contractAddress={addresses.OPENER}
                    contractAbi={epicBoxOpenerAbi}
                    action={async (contract) => {
                      try {
                        console.log("Opening NFT with metadata id:", nft.metadata.id);
                        const contractAddress = contract.getAddress();

                        // Check and set approval if necessary
                        const isApproved = await epicBoxContract!.isApproved(address, contractAddress);
                        if (!isApproved) {
                          console.log("Contract not approved. Setting approval for all.");
                          await epicBoxContract!.setApprovalForAll(contractAddress, true);
                        }

                        setIsOpening(true);

                        if (index < epicBoxes.length) {
                          console.log("Redeeming ticket for Epic Box.");
                          const tx = await contract.call("burnEpicBoxAndMintAssets", [nft.metadata.id], {
                            gasLimit: 10000000,
                            value: ethers.utils.parseEther("0"),
                          });

                          // Parse the transaction receipt to extract events
                          const rewards: Array<{ tokenId: string; contractAddress: string }> = [];

                          for (const log of tx.receipt.logs) {
                            if (log.address.toLowerCase() === addresses.OPENER.toLowerCase()) {
                              const decodedLog = epicBoxOpenerInterface.parseLog(log);
                              if (decodedLog.name === "PlayerMinted") {
                                const playerId = decodedLog.args.playerId.toString();
                                await fetchPlayerWithRetry(getChainName(chainId!), parseInt(playerId, 10));
                                rewards.push({ tokenId: playerId, contractAddress: addresses.PLAYER });
                              } else if (decodedLog.name === "ScoutMinted") {
                                const scoutId = decodedLog.args.scoutId.toString();
                                await fetchScoutWithRetry(getChainName(chainId!), parseInt(scoutId, 10));
                                rewards.push({ tokenId: scoutId, contractAddress: addresses.SCOUT });
                              } else if (decodedLog.name === "LandTicketTransferred") {
                                const landTicketId = decodedLog.args.landTicketId.toString();
                                rewards.push({ tokenId: landTicketId, contractAddress: addresses.LAND });
                              }
                            }
                          }

                          if (rewards.length) {
                            console.log("Rewards received:", rewards);
                            setRewards(rewards);
                          } else {
                            console.error("No rewards found in transaction logs.");
                          }
                        }
                      } catch (err: any) {
                        console.error("Error opening NFT:", err.message ?? "Unknown error");
                        setIsOpening(false);
                      }
                    }}
                  >
                    Open
                  </Web3Button>
                </div>
              ))}
            </div>
          ) : (
            <p>You don&apos;t have any Epic Box...</p>
          )
        ) : (
          <p>Loading...</p>
        )}

        <div className={styles.footer}>Made with &lt;3 for MetaSoccer&apos;s community</div>

        <div className={styles.header}>
          <Image
            alt="MetaSoccer"
            src="https://assets.metasoccer.com/metasoccer-logo.svg"
            height={24}
            width={120}
            className={styles.logo}
          />
          <ConnectWallet />
        </div>
      </div>

      {rewards && (
        <div className={styles.absolute} onClick={() => setRewards(null)}>
          <Zoom>
            <ConfettiExplosion particleCount={300} />
            <div className={styles.nftBoxSmallGrid}>
              {reward1Nft && (
                <div className={styles.nftBox}>
                  <ThirdwebNftMedia
                    metadata={{
                      ...reward1Nft.metadata,
                      image: reward1Nft.metadata.image,
                    }}
                    className={styles.nftMedia}
                  />
                  <h3>{reward1Nft.metadata.name}</h3>
                  <p>{getAssetType(rewards[0].contractAddress, chainId!)}</p>
                  <a
                    href={getOpenSeaLink(chainId!, rewards[0].contractAddress, rewards[0].tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className={styles.button}>View on OpenSea</button>
                  </a>
                </div>
              )}
              {reward2Nft && (
                <div className={styles.nftBox}>
                  <ThirdwebNftMedia
                    metadata={{
                      ...reward2Nft.metadata,
                      image: reward2Nft.metadata.image,
                    }}
                    className={styles.nftMedia}
                  />
                  <h3>{reward2Nft.metadata.name}</h3>
                  <p>{getAssetType(rewards[1].contractAddress, chainId!)}</p>
                  <a
                    href={getOpenSeaLink(chainId!, rewards[1].contractAddress, rewards[1].tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className={styles.button}>View on OpenSea</button>
                  </a>
                </div>
              )}
              {reward3Nft && (
                <div className={styles.nftBox}>
                  <ThirdwebNftMedia
                    metadata={{
                      ...reward3Nft.metadata,
                      image: reward3Nft.metadata.image,
                    }}
                    className={styles.nftMedia}
                  />
                  <h3>{reward3Nft.metadata.name}</h3>
                  <p>{getAssetType(rewards[2].contractAddress, chainId!)}</p>
                  <a
                    href={getOpenSeaLink(chainId!, rewards[2].contractAddress, rewards[2].tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className={styles.button}>View on OpenSea</button>
                  </a>
                </div>
              )}
            </div>
            <h3>Congrats! You got amazing rewards!</h3>
          </Zoom>
        </div>
      )}
    </div>
  );
};

export default Home;