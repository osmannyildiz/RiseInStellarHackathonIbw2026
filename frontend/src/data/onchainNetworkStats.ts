import {
  Account,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk'
import type { xdr } from '@stellar/stellar-sdk'
import type { NetworkSnapshot, NetworkStats } from './networkStats'

const STROOPS_PER_XLM = 10_000_000n

type LoadOnchainNetworkStatsOptions = {
  contractId: string
  rpcUrl: string
  sourceAccount: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getField = (
  value: Record<string, unknown>,
  ...fieldNames: string[]
): unknown => {
  for (const fieldName of fieldNames) {
    if (fieldName in value) {
      return value[fieldName]
    }
  }

  return undefined
}

const toBigInt = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return BigInt(value)
  }

  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value)
  }

  return null
}

const toSafeNumber = (value: bigint): number | null => {
  if (
    value < BigInt(Number.MIN_SAFE_INTEGER) ||
    value > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return null
  }

  return Number(value)
}

const formatStroopsAsXlm = (stroops: bigint): string => {
  const sign = stroops < 0n ? '-' : ''
  const absolute = stroops < 0n ? -stroops : stroops
  const whole = absolute / STROOPS_PER_XLM
  const fractional = absolute % STROOPS_PER_XLM

  if (fractional === 0n) {
    return `${sign}${whole} XLM`
  }

  const fractionText = fractional.toString().padStart(7, '0').replace(/0+$/, '')
  return `${sign}${whole}.${fractionText} XLM`
}

const buildReadTransaction = (
  sourceAccount: Account,
  contractId: string,
  method: string,
) => {
  const contract = new Contract(contractId)

  return new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(30)
    .addOperation(contract.call(method))
    .build()
}

const simulateRead = async (
  server: rpc.Server,
  sourceAccount: Account,
  contractId: string,
  method: string,
): Promise<unknown> => {
  const transaction = buildReadTransaction(sourceAccount, contractId, method)
  const simulation = await server.simulateTransaction(transaction)

  if ('error' in simulation) {
    throw new Error(simulation.error)
  }

  const returnValue: xdr.ScVal | undefined = simulation.result?.retval
  if (!returnValue) {
    throw new Error(`${method} did not return a value`)
  }

  return scValToNative(returnValue)
}

const parseNetworkStats = (
  value: unknown,
  openLoanRequests: number,
): NetworkStats | null => {
  if (!isRecord(value)) {
    return null
  }

  const loanRequestsPosted = toBigInt(
    getField(value, 'loan_requests_posted', 'loanRequestsPosted'),
  )
  const loansFunded = toBigInt(getField(value, 'loans_funded', 'loansFunded'))
  const loansRepaid = toBigInt(getField(value, 'loans_repaid', 'loansRepaid'))
  const totalXlmLent = toBigInt(
    getField(value, 'total_xlm_lent', 'totalXlmLent'),
  )
  const totalFeesPaid = toBigInt(
    getField(value, 'total_fees_paid', 'totalFeesPaid'),
  )
  const totalRepaymentSeconds = toBigInt(
    getField(value, 'total_repayment_seconds', 'totalRepaymentSeconds'),
  )

  if (
    loanRequestsPosted === null ||
    loansFunded === null ||
    loansRepaid === null ||
    totalXlmLent === null ||
    totalFeesPaid === null ||
    totalRepaymentSeconds === null
  ) {
    return null
  }

  const loanRequestsPostedNumber = toSafeNumber(loanRequestsPosted)
  const loansFundedNumber = toSafeNumber(loansFunded)
  const loansRepaidNumber = toSafeNumber(loansRepaid)

  if (
    loanRequestsPostedNumber === null ||
    loansFundedNumber === null ||
    loansRepaidNumber === null
  ) {
    return null
  }

  const averageRepaymentTimeSeconds =
    loansRepaid === 0n
      ? null
      : toSafeNumber(totalRepaymentSeconds / loansRepaid)

  if (loansRepaid !== 0n && averageRepaymentTimeSeconds === null) {
    return null
  }

  return {
    openLoanRequests,
    loanRequestsPosted: loanRequestsPostedNumber,
    loansFunded: loansFundedNumber,
    loansRepaid: loansRepaidNumber,
    totalXlmLent: formatStroopsAsXlm(totalXlmLent),
    totalFeesPaid: formatStroopsAsXlm(totalFeesPaid),
    averageRepaymentTimeSeconds,
  }
}

export const loadOnchainNetworkStats = async ({
  contractId,
  rpcUrl,
  sourceAccount,
}: LoadOnchainNetworkStatsOptions): Promise<NetworkSnapshot> => {
  const server = new rpc.Server(rpcUrl)
  const loadedSourceAccount = await server.getAccount(sourceAccount)

  const [rawStats, rawOpenLoanRequestIds] = await Promise.all([
    simulateRead(server, loadedSourceAccount, contractId, 'get_network_stats'),
    simulateRead(
      server,
      loadedSourceAccount,
      contractId,
      'list_open_loan_request_ids',
    ),
  ])

  if (!Array.isArray(rawOpenLoanRequestIds)) {
    throw new Error('Open loan request IDs were not returned as a list')
  }

  const stats = parseNetworkStats(rawStats, rawOpenLoanRequestIds.length)
  if (stats === null) {
    throw new Error('Unable to decode on-chain network stats')
  }

  return {
    source: 'contract-read',
    generatedAt: new Date().toISOString(),
    contractId,
    rpcUrl,
    stats,
    eventIndexed: false,
  }
}
