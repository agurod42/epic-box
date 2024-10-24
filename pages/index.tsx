import {
  ConnectEmbed,
  ConnectWallet,
  NFT,
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useNFT,
  useOwnedNFTs,
  Web3Button
} from "@thirdweb-dev/react";
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

const LAND_CONTRACT_ADDRESS = "0x1C80e3D799eBf28E47C488EcdABd7ea47B5d8595";
const PLAYER_CONTRACT_ADDRESS = "0x6f5D7bA06aD7B28319d86fceC09fae5bbC83d32F";
const SCOUT_CONTRACT_ADDRESS = "0x94E42811Db93EF7831595b6fF9360491B987DFbD";

const OPENER_CONTRACT_ADDRESS = "0x312cC0B8e2b2F81cef459f40F821fcDda6Ab4e67";

const epicBoxOpenerInterface = new Interface(epicBoxOpenerAbi);

const Home: NextPage = () => {
  const address = useAddress();

  const [isOpening, setIsOpening] = useState(false);
  const [redeemableNfts, setRedeemableNfts] = useState<NFT[]>([]);
  const [rewards, setRewards] = useState<Array<{ tokenId: any, contractAddress: string }> | null>(null);

  const { contract: epicBoxContract } = useContract("0xB7F21E3A4B2B3fD8b897201a2Fb47A973c8E5A2c", "nft-collection");

  const landContract = useContract(LAND_CONTRACT_ADDRESS, "nft-collection").contract;
  const playerContract = useContract(PLAYER_CONTRACT_ADDRESS, "nft-collection").contract;
  const scoutContract = useContract(SCOUT_CONTRACT_ADDRESS, "nft-collection").contract;

  const contractMap = {
    [LAND_CONTRACT_ADDRESS]: landContract,
    [PLAYER_CONTRACT_ADDRESS]: playerContract,
    [SCOUT_CONTRACT_ADDRESS]: scoutContract
  };

  const { data: epicBoxes = [], isLoading: isLoadingEpicBoxes } = useOwnedNFTs(epicBoxContract, address);

  const { data: reward1Nft } = useNFT(contractMap[rewards?.[0]?.contractAddress as keyof typeof contractMap], rewards?.[0]?.tokenId as string);
  const { data: reward2Nft } = useNFT(contractMap[rewards?.[1]?.contractAddress as keyof typeof contractMap], rewards?.[1]?.tokenId as string);
  const { data: reward3Nft } = useNFT(contractMap[rewards?.[2]?.contractAddress as keyof typeof contractMap], rewards?.[2]?.tokenId as string);

  const isLoading = isLoadingEpicBoxes;

  useEffect(() => {
    if (rewards?.find((reward) => reward.tokenId == reward1Nft?.metadata.id) && reward1Nft) {
      console.log("Reward tokenId matches landNft metadata id. Stopping opening process.");
      setIsOpening(false);
    }
  }, [rewards, reward1Nft, reward2Nft, reward3Nft]);

  console.log("rewards", rewards);
  console.log("reward1Nft", reward1Nft);
  console.log("reward2Nft", reward2Nft);
  console.log("reward3Nft", reward3Nft);
  console.log("isOpening", isOpening);
  console.log("epicBoxes", epicBoxes);

  useDeepCompareEffect(() => {
    if (!isOpening) {
      console.log("Not opening. Setting redeemable NFTs.");
      setRedeemableNfts(epicBoxes);
    }
  }, [isOpening, epicBoxes])

  if (!address) {
    console.log("No address found. Rendering ConnectEmbed.");
    return (
      <div className={styles.container} style={{ marginTop: 0 }}>
        <div className={styles.collectionContainer}>
          <ConnectEmbed
            showThirdwebBranding={false}  
          />

          <div className={styles.footer}>
            Made with &lt;3 for MetaSoccer&apos;s community
          </div>

          <div className={styles.header}>
            <Image alt="MetaSoccer" src="https://assets.metasoccer.com/metasoccer-logo.svg" height={24} width={120} className={styles.logo} />
          </div>
        </div>
      </div>
    );
  }

  const getAssetType = (contractAddress: string) => {
    switch (contractAddress) {
      case LAND_CONTRACT_ADDRESS:
        return "Land";
      case PLAYER_CONTRACT_ADDRESS:
        return "Player";
      case SCOUT_CONTRACT_ADDRESS:
        return "Scout";
      default:
        return "Unknown";
    }
  };

  const getOpenSeaLink = (contractAddress: string, tokenId: string) => {
    return `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`;
  };

  return (
    <div className={styles.container} style={{ marginTop: 0 }}>
      <div className={styles.collectionContainer}>
        {!isLoading ? (
          ((redeemableNfts?.length ?? 0) > 0) ? (
            <div className={styles.nftBoxGrid}>
              {redeemableNfts?.map((nft, index) => (
                <div className={styles.nftBox} key={nft.metadata.id.toString()}>
                  <ThirdwebNftMedia
                    // @ts-ignore
                    metadata={{
                      ...nft.metadata,
                      image: `${nft.metadata.image}`,
                    }}
                    className={styles.nftMedia}
                  />
                  <h3>{nft.metadata.name}</h3>

                  <Web3Button
                    contractAddress={OPENER_CONTRACT_ADDRESS}
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
                          // Inside the action of Web3Button
                          const tx = await contract.call("burnEpicBoxAndMintAssets", [nft.metadata.id], { gasLimit: 10000000, value: ethers.utils.parseEther("0") });
                          console.log(tx.receipt.logs);

                          // Parse the transaction receipt to extract events
                          const rewards = [];

                          for (const log of tx.receipt.logs) {
                            // Define the topics you are interested in and decode the logs accordingly
                            if (log.address.toLowerCase() === OPENER_CONTRACT_ADDRESS.toLowerCase()) {
                              const decodedLog = epicBoxOpenerInterface.parseLog(log);
                              if (decodedLog.name === "PlayerMinted") {
                                const playerId = decodedLog.args.playerId.toString();
                                rewards.push({ tokenId: playerId, contractAddress: PLAYER_CONTRACT_ADDRESS });
                              } else if (decodedLog.name === "ScoutMinted") {
                                const scoutId = decodedLog.args.scoutId.toString();
                                rewards.push({ tokenId: scoutId, contractAddress: SCOUT_CONTRACT_ADDRESS });
                              } else if (decodedLog.name === "LandTicketTransferred") {
                                const landTicketId = decodedLog.args.landTicketId.toString();
                                rewards.push({ tokenId: landTicketId, contractAddress: LAND_CONTRACT_ADDRESS });
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

        <div className={styles.footer}>
          Made with &lt;3 for MetaSoccer&apos;s community
        </div>

        <div className={styles.header}>
          <Image alt="MetaSoccer" src="https://assets.metasoccer.com/metasoccer-logo.svg" height={24} width={120} className={styles.logo} />
          <ConnectWallet />
        </div>
      </div>

      {rewards && (
        <div className={styles.absolute} onClick={() => setRewards(null)}>
          <Zoom>
            <ConfettiExplosion particleCount={300} />
            <div className={styles.nftBoxSmallGrid}>
              <div className={styles.nftBox}>
                {reward1Nft && (
                  <>
                    <ThirdwebNftMedia
                      metadata={{
                        ...reward1Nft.metadata,
                        image: `${reward1Nft.metadata.image}`,
                      }}
                      className={styles.nftMedia}
                    />
                    <h3>{reward1Nft.metadata.name}</h3>
                    <p>{getAssetType(rewards[0].contractAddress)}</p>
                    <a href={getOpenSeaLink(rewards[0].contractAddress, rewards[0].tokenId)} target="_blank" rel="noopener noreferrer">
                      <button className={styles.button}>View on OpenSea</button>
                    </a>
                  </>
                )}
              </div>
              <div className={styles.nftBox}>
                {reward2Nft && (
                  <>
                    <ThirdwebNftMedia
                      metadata={{
                        ...reward2Nft.metadata,
                        image: `${reward2Nft.metadata.image}`,
                      }}
                      className={styles.nftMedia}
                    />
                    <h3>{reward2Nft.metadata.name}</h3>
                    <p>{getAssetType(rewards[1].contractAddress)}</p>
                    <a href={getOpenSeaLink(rewards[1].contractAddress, rewards[1].tokenId)} target="_blank" rel="noopener noreferrer">
                      <button className={styles.button}>View on OpenSea</button>
                    </a>
                  </>
                )}
              </div>
              <div className={styles.nftBox}>
                {reward3Nft && (
                  <>
                    <ThirdwebNftMedia
                      metadata={{
                        ...reward3Nft.metadata,
                        image: `${reward3Nft.metadata.image}`,
                      }}
                      className={styles.nftMedia}
                    />
                    <h3>{reward3Nft.metadata.name}</h3>
                    <p>{getAssetType(rewards[2].contractAddress)}</p>
                    <a href={getOpenSeaLink(rewards[2].contractAddress, rewards[2].tokenId)} target="_blank" rel="noopener noreferrer">
                      <button className={styles.button}>View on OpenSea</button>
                    </a>
                  </>
                )}
              </div>
            </div>
            <h3>Congrats! You got three amazing rewards!</h3>
          </Zoom>
        </div>
      )}
    </div>
  );
};

export default Home;
