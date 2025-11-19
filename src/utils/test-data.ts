import type { TestOrderData, Payment } from '@/types'

function normalizeOperation(operation: TestOrderData['input']['operation']) {
  if (!operation) {
    return { name: () => '' }
  }

  if (typeof operation.name === 'function') {
    return operation
  }

  const originalValue = operation.name
  return {
    ...operation,
    name: () => {
      if (typeof originalValue === 'string') {
        return originalValue
      }
      if (originalValue === null || originalValue === undefined) {
        return ''
      }
      return String(originalValue)
    }
  }
}

function normalizeShouldIncludeMarketplace(input: TestOrderData['input']) {
  const existing = input.shouldIncludeMarketplaceItemsOnly

  if (typeof existing === 'function') {
    return existing
  }

  const defaultValue = typeof existing === 'boolean' ? existing : false
  return () => defaultValue
}

function normalizePayments(payments?: Payment[]): Payment[] {
  if (!Array.isArray(payments)) {
    return []
  }

  return payments.map(payment => ({
    amount: typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0,
    paymentMethod: payment.paymentMethod || '',
    clearingProvider: payment.clearingProvider || ''
  }))
}

export function normalizeTestData(data: TestOrderData): TestOrderData {
  if (!data.input) {
    data.input = {
      orderMetadata: {
        orderCode: '',
        orderId: 0,
        handlingStrategy: 'GEN2',
        orderCreationTime: new Date().toISOString()
      },
      operation: { name: () => '' },
      processingTime: new Date().toISOString()
    }
  }

  data.input.operation = normalizeOperation(data.input.operation)
  data.input.shouldIncludeMarketplaceItemsOnly = normalizeShouldIncludeMarketplace(data.input)

  if (!data.input.orderMetadata) {
    data.input.orderMetadata = {
      orderCode: '',
      orderId: 0,
      handlingStrategy: 'GEN2',
      orderCreationTime: new Date().toISOString()
    }
  }

  data.input.orderMetadata.payments = normalizePayments(data.input.orderMetadata.payments)

  return data
}


