export interface SapPaymentItem {
  amount: number
  paymentMethod: string
  paymentServiceProvider: string
  clearingProvider: string
}

export interface SapCondition {
  conditionType: string
  conditionValue: string
}

export interface SapOrderPayload {
  countryCode: string
  entity: string
  orderId: string
  glovoOrderId: string
  restaurantId: string
  currency: string
  orderCity: string
  status: string
  deliveryServiceProvider: string
  orderDate: string
  orderTime: string
  timestamp: string
  deliveryDate: string
  deliveryTime: string
  expectedDeliveryDate: string
  paymentProvider: string
  orderSubVertical: string
  vendorCancellationStrategy: string
  customerCancellationStrategy: string
  Payments: SapPaymentItem[]
  items: {
    condition: SapCondition[]
  }
}

