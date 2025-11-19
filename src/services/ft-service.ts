import type { TestOrderData, OrderInput, OrderMetadata } from '@/types/order-data'
import type { InvoicingItemAmount } from '@/types/invoicing-items'

// Types for FT API Responses

export interface FtTransaction {
  id: string
  timestamp: string
  invoiceItems: Array<{
    items: Array<{
      concept: string
      amount: {
        number: number
      }
      taxDetails: {
        netAmount: { number: number }
        grossAmount: { number: number }
      } | null
    }>
  }>
}

interface FtTransactionsResponse {
  data: FtTransaction[]
}

export interface FtOrderResponse {
  data: {
    order: {
      orderId: number
      orderCode: string
      orderHandlingStrategy: string
      countryCode: { value: string }
      cityCode: string
      currencyCode: string
      isB2BOrder: boolean
      isMarketplaceOrder: boolean
      isSplitOrder: boolean
      isPrimeOrder: boolean
    }
    storeAddress?: {
      storeAddressId: string
      partnerFamily: string
      partnerCancellationStrategy: string | null
    }
    customer?: {
      customerCancellationStrategy: string | null
    }
    timing: {
      creationDateTime: string
      dispatchingDateTime: string | null
      finalStatusDateTime: string | null
    }
  }
}

const BASE_URL = '/api/ft/v1/financial/order'

export async function fetchTransactions(orderId: string): Promise<FtTransaction[]> {
  // Note: In a real environment, this would need a proxy or CORS handling if calling from browser
  // For this implementation, we assume the environment allows it or we are using a proxy
  const response = await fetch(`${BASE_URL}/${orderId}/transactions`)
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`)
  }
  const json = await response.json() as FtTransactionsResponse
  return json.data
}

export async function fetchOrderDetails(orderId: string): Promise<FtOrderResponse['data']> {
  const response = await fetch(`${BASE_URL}/${orderId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch order details: ${response.statusText}`)
  }
  const json = await response.json() as FtOrderResponse
  return json.data
}

export function mapToTestOrderData(
  transaction: FtTransaction, 
  orderDetails: FtOrderResponse['data']
): TestOrderData {
  // Map Invoicing Items
  const invoicingItems: Record<string, InvoicingItemAmount> = {}
  
  if (transaction && transaction.invoiceItems) {
    transaction.invoiceItems.forEach(group => {
      if (group.items) {
        group.items.forEach(item => {
          const amount: InvoicingItemAmount = {}
          
          if (item.taxDetails) {
            amount.grossAmount = { value: item.taxDetails.grossAmount.number }
            amount.netAmount = { value: item.taxDetails.netAmount.number }
          } else if (item.amount) {
            // Fallback to just amount if no tax details or if structure differs
            amount.amount = { value: item.amount.number }
          }
          
          if (item.concept) {
            invoicingItems[item.concept] = amount
          }
        })
      }
    })
  } else {
    console.warn('No invoice items found in transaction:', transaction)
  }

  // Map Order Metadata
  const orderMetadata: OrderMetadata = {
    orderCode: orderDetails.order.orderCode,
    orderId: orderDetails.order.orderId,
    storeAddressId: orderDetails.storeAddress ? Number(orderDetails.storeAddress.storeAddressId) : undefined,
    handlingStrategy: orderDetails.order.orderHandlingStrategy as any, // converting string to union type blindly for now
    orderCreationTime: orderDetails.timing.creationDateTime,
    finalStatusDateTime: orderDetails.timing.finalStatusDateTime || undefined,
    orderDispatchingTime: orderDetails.timing.dispatchingDateTime || undefined,
    vertical: undefined, // Not explicitly in sample data, might need to be inferred or added later
    subvertical: undefined,
    partnerFamily: orderDetails.storeAddress?.partnerFamily,
    partnerCancellationStrategy: orderDetails.storeAddress?.partnerCancellationStrategy || undefined,
    customerCancellationStrategy: orderDetails.customer?.customerCancellationStrategy || undefined,
    // Default empty payments as not provided in sample FT response directly in the same format
    payments: [] 
  }

  const input: OrderInput = {
    orderMetadata,
    operation: {
      name: () => 'complete' // Defaulting to complete as in sample
    },
    processingTime: new Date().toISOString() // Using current time as processing time
  }

  return {
    input,
    invoicingItems,
    financialSourceCountryCodeValue: orderDetails.order.countryCode.value,
    currencyCodeValue: orderDetails.order.currencyCode,
    cityCodeValue: orderDetails.order.cityCode,
    isVatOptimisedOrder: false // Default
  }
}
