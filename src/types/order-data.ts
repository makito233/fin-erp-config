import type { InvoicingItemAmount } from './invoicing-items'

export interface Payment {
  amount: number
  paymentMethod: string
  clearingProvider?: string
}

export interface OrderMetadata {
  orderCode: string
  orderId: number
  storeAddressId?: number
  handlingStrategy: 'GEN1' | 'GEN2' | 'PICKUP'
  orderCreationTime: string
  finalStatusDateTime?: string
  orderDispatchingTime?: string
  vertical?: string
  subvertical?: string
  partnerFamily?: string
  partnerCancellationStrategy?: string
  customerCancellationStrategy?: string
  payments?: Payment[]
}

export interface Operation {
  name: () => string
}

export interface OrderInput {
  orderMetadata: OrderMetadata
  operation: Operation
  processingTime: string
  shouldIncludeMarketplaceItemsOnly?: () => boolean
}

export interface TestOrderData {
  input: OrderInput
  invoicingItems: Record<string, InvoicingItemAmount>
  financialSourceCountryCodeValue: string
  currencyCodeValue: string
  cityCodeValue: string
  isVatOptimisedOrder?: boolean
}

