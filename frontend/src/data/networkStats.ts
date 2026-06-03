import { loadOnchainNetworkStats } from './onchainNetworkStats'

export type StatSource = 'contract-read' | 'event-index'

export type NetworkStats = {
  openLoanRequests: number
  loanRequestsPosted: number
  loansFunded: number
  loansRepaid: number
  totalXlmLent: string
  totalFeesPaid: string
  averageRepaymentTimeSeconds: number | null
}

export type NetworkSnapshot = {
  source: StatSource
  generatedAt: string
  contractId: string
  rpcUrl?: string
  stats: NetworkStats
  eventIndexed: boolean
}

export type NetworkStatsState =
  | { status: 'ready'; snapshot: NetworkSnapshot }
  | { status: 'unavailable'; reason: string }

const DEFAULT_STATS_PATH = '/network-stats.json'
const DEFAULT_CONTRACT_ID = 'CDWOX522NJRVQJV2BXXRO6LTFYLOTMZ36LH7EGZC3TDIJYDYMCWM4P43'
const DEFAULT_RPC_URL = 'https://soroban-testnet.stellar.org'
const DEFAULT_READ_SOURCE_ACCOUNT =
  'GA77IKJEPCZOB2GLCFVHRHUEM7TFU5YBON55VVTIKMGESIC6ZPZFDV7B'

export const getConfiguredContractId = (): string =>
  import.meta.env.VITE_CLAWLOAN_CONTRACT_ID ?? DEFAULT_CONTRACT_ID

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

const parseStats = (value: unknown): NetworkStats | null => {
  if (!isRecord(value)) {
    return null
  }

  const openLoanRequests = asNumber(value.openLoanRequests)
  const loanRequestsPosted = asNumber(value.loanRequestsPosted)
  const loansFunded = asNumber(value.loansFunded)
  const loansRepaid = asNumber(value.loansRepaid)
  const rawAverageRepaymentTimeSeconds = value.averageRepaymentTimeSeconds
  const averageRepaymentTimeSeconds =
    rawAverageRepaymentTimeSeconds === null
      ? null
      : asNumber(rawAverageRepaymentTimeSeconds)

  if (
    openLoanRequests === null ||
    loanRequestsPosted === null ||
    loansFunded === null ||
    loansRepaid === null ||
    (rawAverageRepaymentTimeSeconds !== null &&
      averageRepaymentTimeSeconds === null)
  ) {
    return null
  }

  return {
    openLoanRequests,
    loanRequestsPosted,
    loansFunded,
    loansRepaid,
    totalXlmLent: String(value.totalXlmLent ?? ''),
    totalFeesPaid: String(value.totalFeesPaid ?? ''),
    averageRepaymentTimeSeconds,
  }
}

const parseSnapshot = (value: unknown): NetworkSnapshot | null => {
  if (!isRecord(value)) {
    return null
  }

  let source: StatSource | null = null
  if (value.source === 'contract-read' || value.source === 'event-index') {
    source = value.source
  }
  const generatedAt = asString(value.generatedAt)
  const contractId = asString(value.contractId)
  const stats = parseStats(value.stats)

  if (
    source === null ||
    generatedAt === null ||
    contractId === null ||
    stats === null
  ) {
    return null
  }

  return {
    source,
    generatedAt,
    contractId,
    rpcUrl: asString(value.rpcUrl) ?? undefined,
    stats,
    eventIndexed: value.eventIndexed === true,
  }
}

const loadSnapshotNetworkStats = async (): Promise<NetworkStatsState> => {
  const statsPath = import.meta.env.VITE_CLAWLOAN_STATS_PATH ?? DEFAULT_STATS_PATH

  try {
    const response = await fetch(statsPath, { cache: 'no-store' })
    if (!response.ok) {
      return {
        status: 'unavailable',
        reason: 'Network activity will appear here after a contract snapshot is published.',
      }
    }

    const snapshot = parseSnapshot(await response.json())
    if (snapshot === null) {
      return {
        status: 'unavailable',
        reason: 'The latest network snapshot is unavailable.',
      }
    }

    return { status: 'ready', snapshot }
  } catch {
    return {
      status: 'unavailable',
      reason: 'Unable to load the latest network snapshot.',
    }
  }
}

export const loadNetworkStats = async (): Promise<NetworkStatsState> => {
  const contractId = getConfiguredContractId()
  const rpcUrl = import.meta.env.VITE_CLAWLOAN_RPC_URL ?? DEFAULT_RPC_URL
  const sourceAccount =
    import.meta.env.VITE_CLAWLOAN_READ_SOURCE_ACCOUNT ??
    DEFAULT_READ_SOURCE_ACCOUNT

  try {
    const snapshot = await loadOnchainNetworkStats({
      contractId,
      rpcUrl,
      sourceAccount,
    })

    return { status: 'ready', snapshot }
  } catch {
    return loadSnapshotNetworkStats()
  }
}

export const readMethods = [
  'get_network_stats',
  'list_open_loan_request_ids',
  'get_loan_request',
  'get_loan',
]
