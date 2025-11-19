import { SpelExpressionEvaluator } from 'spel2js'
import type { TestOrderData } from '@/types'

// Create context manually for spel2js compatibility
export type EvaluationContext = any

export interface EvaluationResult {
  success: boolean
  value: any
  error?: string
}

export function evaluateSpelExpression(
  expression: string,
  context: EvaluationContext
): EvaluationResult {
  try {
    if (!expression || expression.trim() === '') {
      return { success: true, value: null }
    }

    const locals: Record<string, any> = {}

    if (context && typeof context === 'object') {
      Object.entries(context).forEach(([key, value]) => {
        locals[key] = value
      })
    }

    const compiledExpression = SpelExpressionEvaluator.compile(expression)
    const result = compiledExpression.eval({}, locals)

    return { success: true, value: result }
  } catch (error) {
    return {
      success: false,
      value: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export function createEvaluationContext(testData: TestOrderData): EvaluationContext {
  return {
    input: testData.input,
    invoicingItems: testData.invoicingItems,
    financialSourceCountryCodeValue: testData.financialSourceCountryCodeValue,
    currencyCodeValue: testData.currencyCodeValue,
    cityCodeValue: testData.cityCodeValue,
    isVatOptimisedOrder: testData.isVatOptimisedOrder,
  }
}
