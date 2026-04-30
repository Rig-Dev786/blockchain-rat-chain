import { createConfig, http } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [polygonMumbai],
  connectors: [metaMask()],
  transports: { [polygonMumbai.id]: http() },
});
