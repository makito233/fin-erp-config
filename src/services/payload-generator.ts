import type { SapConfig, TestOrderData } from '@/types'
import { evaluateSpelExpression, createEvaluationContext } from './spel-evaluator'

export interface PayloadGenerationResult {
  success: boolean
  payload: any
  errors: Array<{ field: string; error: string }>
}

export function generateSapPayload(
  config: SapConfig,
  testData: TestOrderData,
  selectedCountry: string
): PayloadGenerationResult {
  const context = createEvaluationContext(testData)
  const payload: any = {}
  const errors: Array<{ field: string; error: string }> = []

  // Generate field mappings
  Object.entries(config.fieldMappings).forEach(([fieldName, mapping]) => {
    // Find expression for the selected country
    const countryExpr = mapping.expressionsByCountry.find(expr =>
      expr.countries.includes(selectedCountry)
    )

    if (!countryExpr) {
      errors.push({
        field: fieldName,
        error: `No expression found for country ${selectedCountry}`
      })
      return
    }

    if (mapping.type === 'array' && mapping.itemsMappings) {
      // Handle array types
      const arrayResult = evaluateSpelExpression(countryExpr.expression, context)
      
      if (arrayResult.success && Array.isArray(arrayResult.value)) {
        payload[fieldName] = arrayResult.value.map((item: any) => {
          const mappedItem: any = {}
          
          Object.entries(mapping.itemsMappings!).forEach(([itemField, itemMapping]) => {
            const itemCountryExpr = itemMapping.expressionsByCountry.find(expr =>
              expr.countries.includes(selectedCountry)
            )
            
            if (itemCountryExpr) {
              // Create context with item
              const itemContext = { ...context, item }
              const itemResult = evaluateSpelExpression(itemCountryExpr.expression, itemContext)
              
              if (itemResult.success) {
                mappedItem[itemField] = formatValue(itemResult.value, itemMapping.type, itemMapping.format)
              } else {
                errors.push({
                  field: `${fieldName}.${itemField}`,
                  error: itemResult.error || 'Evaluation failed'
                })
              }
            }
          })
          
          return mappedItem
        })
      } else if (!arrayResult.success) {
        errors.push({
          field: fieldName,
          error: arrayResult.error || 'Failed to evaluate array expression'
        })
      }
    } else {
      // Handle simple types
      const result = evaluateSpelExpression(countryExpr.expression, context)
      
      if (result.success) {
        payload[fieldName] = formatValue(result.value, mapping.type, mapping.format)
      } else {
        errors.push({
          field: fieldName,
          error: result.error || 'Evaluation failed'
        })
      }
    }
  })

  // Generate condition mappings
  const conditions: Array<{ conditionType: string; conditionValue: string }> = []
  
  config.conditionMappings.forEach(condMapping => {
    const countryExpr = condMapping.expressionsByCountry.find(expr =>
      expr.countries.includes(selectedCountry)
    )

    if (!countryExpr) {
      return
    }

    const result = evaluateSpelExpression(countryExpr.expression, context)
    
    if (result.success) {
      // Updated: User wants all conditions to be populated, relying on correct fallbacks in SpEL
      // However, if it still evaluates to null (despite expected fallbacks), we should probably default it or include it as 0
      // or let it be null if that's what the expression yielded.
      // Reverting the logic to ALWAYS add it, as requested.
      
      conditions.push({
        conditionType: condMapping.conditionType,
        conditionValue: formatValue(result.value, 'double')
      })
      
    } else {
      errors.push({
        field: condMapping.conditionType,
        error: result.error || 'Evaluation failed'
      })
    }
  })

  if (conditions.length > 0) {
    payload.items = { condition: conditions }
  }

  return {
    success: errors.length === 0,
    payload,
    errors
  }
}

function formatValue(value: any, type: string, format?: string): any {
  if (value === null || value === undefined) {
    if (type.startsWith('optional_')) {
      return ''
    }
    
    // For 'double', if we get null/undefined, we default to '0.00' to ensure
    // conditions always have a value (as user requested "all conditions should be populated")
    if (type === 'double') {
         return '0.00' 
    }
    return value
  }

  switch (type) {
    case 'string':
    case 'optional_string':
      return String(value)
    
    case 'double':
      const num = Number(value)
      return isNaN(num) ? '0.00' : num.toFixed(2)
    
    case 'local_date_time':
    case 'optional_local_date_time':
      if (format) {
        return formatDateTime(value, format)
      }
      return value
    
    default:
      return value
  }
}

function formatDateTime(value: any, format: string): string {
  // Simple date formatting
  // In a real implementation, you'd use a library like date-fns
  
  try {
    const date = new Date(value)
    
    if (isNaN(date.getTime())) {
      return value
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const millis = String(date.getMilliseconds()).padStart(3, '0')
    
    return format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('SSS', millis)
  } catch (error) {
    return value
  }
}
