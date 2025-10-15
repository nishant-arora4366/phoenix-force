export type AuctionErrorCode =
  | 'BID_OUTDATED'
  | 'INSUFFICIENT_FUNDS'
  | 'CHECK_FAILED'
  | 'UNIQUE_VIOLATION'
  | 'UNKNOWN';

interface ErrorMeta {
  title: string;
  message: (ctx?: any) => string;
  severity: 'info' | 'warning' | 'error';
  retry?: boolean;
}

export const ERROR_MAP: Record<AuctionErrorCode, ErrorMeta> = {
  BID_OUTDATED: {
    title: 'Outbid',
    message: ctx => `A newer bid${ctx?.latestAmount ? ` (₹${ctx.latestAmount})` : ''} landed just before yours.`,
    severity: 'warning',
    retry: true
  },
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Funds',
    message: () => 'This bid would drop your purse below the required reserve.',
    severity: 'error'
  },
  CHECK_FAILED: {
    title: 'Validation Failed',
    message: ctx => ctx?.raw || 'Bid failed a server-side check.',
    severity: 'error'
  },
  UNIQUE_VIOLATION: {
    title: 'Concurrent Update',
    message: () => 'A concurrent update occurred. Refresh and try again.',
    severity: 'warning',
    retry: true
  },
  UNKNOWN: {
    title: 'Unexpected Error',
    message: ctx => ctx?.raw || 'Something went wrong.',
    severity: 'error'
  }
};

export function interpretError(codeRaw?: string) {
  if (!codeRaw) return ERROR_MAP.UNKNOWN;
  const upper = codeRaw.toUpperCase() as AuctionErrorCode;
  return ERROR_MAP[upper] ?? ERROR_MAP.UNKNOWN;
}
