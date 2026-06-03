import { useEffect, useState } from 'react'
import { AgentFlowSection } from './components/AgentFlowSection'
import { Hero } from './components/Hero'
import { InfoSections } from './components/InfoSections'
import { InstallSection } from './components/InstallSection'
import { NetworkStatsPanel } from './components/NetworkStatsPanel'
import { loadNetworkStats, type NetworkStatsState } from './data/networkStats'
import './App.css'

const testnetContractUrl = (contractId: string) =>
  `https://stellar.expert/explorer/testnet/contract/${contractId}`

function App() {
  const [networkStats, setNetworkStats] = useState<NetworkStatsState>({
    status: 'unavailable',
    reason: 'Loading generated contract stats.',
  })

  useEffect(() => {
    let isMounted = true

    loadNetworkStats().then((state) => {
      if (isMounted) {
        setNetworkStats(state)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const configuredContractId =
    networkStats.status === 'ready'
      ? networkStats.snapshot.contractId
      : import.meta.env.VITE_CLAWLOAN_CONTRACT_ID

  const contractId =
    typeof configuredContractId === 'string' && configuredContractId.length > 0
      ? configuredContractId
      : undefined

  return (
    <main>
      <Hero contractId={contractId} />
      <InstallSection />
      <AgentFlowSection />
      <NetworkStatsPanel state={networkStats} />
      <InfoSections
        contractHref={contractId ? testnetContractUrl(contractId) : undefined}
      />
    </main>
  )
}

export default App
