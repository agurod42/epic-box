import { Chain, Polygon, XdcNetwork } from "@thirdweb-dev/chains";
import { ThirdwebProvider, useChainId } from "@thirdweb-dev/react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import "../styles/globals.css";

const supportedChains = [
  Polygon,
  XdcNetwork
];

function MyApp({ Component, pageProps }: AppProps) {
  const [chain, setChain] = useState<Chain>(Polygon);

  return (
    <ThirdwebProvider activeChain={chain} supportedChains={supportedChains} clientId="a8fd5d4d91d0da0f0485ac27da84b578">
      <InnerThirdwebProvider onChainChange={setChain}>
        <Component {...pageProps} />
      </InnerThirdwebProvider>
    </ThirdwebProvider>
  );
}

function InnerThirdwebProvider({ children, onChainChange }: { children: React.ReactNode, onChainChange: (chain: Chain) => void }) {
  const chainId = useChainId();

  useEffect(() => {
    if (chainId) {
      const chain = supportedChains.find(chain => chain.chainId === chainId);
      if (chain) {
        console.log(`Setting chain to ${chain.name}`);
        onChainChange(chain);
      } else {
        console.warn(`Unsupported chainId: ${chainId}`);
      }
    }
  }, [chainId, onChainChange]);

  return <>{children}</>;
};

export default MyApp;
