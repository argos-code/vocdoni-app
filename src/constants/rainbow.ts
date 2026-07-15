import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { coinbaseWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { arbitrum, avalanche, base, bsc, gnosis, mainnet, optimism, polygon } from 'wagmi/chains'

// Define chains for the application
const chains = [mainnet, arbitrum, avalanche, base, bsc, gnosis, optimism, polygon] as const

export { chains }

const appName = 'Vocdoni UI Scaffold'
const projectId = '641a1f59121ad0b519cca3a699877a08'

const featuredConnectors = [
  {
    groupName: 'Popular',
    wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet],
  },
]

const connectors = connectorsForWallets(featuredConnectors, {
  appName,
  projectId,
})

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [gnosis.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
  },
})
