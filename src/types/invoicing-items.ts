export interface InvoicingItem {
  name: string
  sourceType: string
  from: string
  to: string
  issuer: string
  recipient: string
  amountType: string
  taxation: string
  description: string
}

export interface InvoicingItemAmount {
  grossAmount?: { value: number }
  netAmount?: { value: number }
  amount?: { value: number }
}

