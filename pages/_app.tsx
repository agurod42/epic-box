import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Polygon;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider activeChain={activeChainId} autoSwitch clientId="a8fd5d4d91d0da0f0485ac27da84b578">
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
