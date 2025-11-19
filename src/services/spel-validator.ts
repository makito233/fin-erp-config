import { SpelExpressionEvaluator } from 'spel2js'
import type { InvoicingItem, MetadataVariable } from '@/types'

export interface SpelValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  variables: string[]
}

export function validateSpelExpression(
  expression: string,
  invoicingItems: InvoicingItem[],
  metadataVariables: MetadataVariable[]
): SpelValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const variables: string[] = []

  // Use spel2js to validate syntax
  try {
    if (expression && expression.trim() !== '') {
      // SpelExpressionEvaluator is an object, not a class
      SpelExpressionEvaluator.compile(expression)
    }
  } catch (error) {
    errors.push(`Syntax error: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Continue with custom validation logic for variables and business rules
  // Regex based validation is still useful here for static analysis without executing

  // Extract and validate invoicing item references
  const invoicingItemPattern = /#invoicingItems\['([^']+)'\]/g
  let match
  const invoicingItemNames = new Set(invoicingItems.map(i => i.name))
  
  while ((match = invoicingItemPattern.exec(expression)) !== null) {
    const itemName = match[1]
    variables.push(`#invoicingItems['${itemName}']`)
    
    if (!invoicingItemNames.has(itemName)) {
      // Only warn if not found, as it might be valid but just not in our reference list
      // Or keep as error if we want strict validation
      errors.push(`Unknown invoicing item: '${itemName}'`)
    }
  }

  // Extract and validate metadata variables
  const metadataPattern = /#(\w+(?:\.\w+|\?\.w+)*)/g
  const knownVariables = new Set(metadataVariables.map(v => v.name))
  
  while ((match = metadataPattern.exec(expression)) !== null) {
    const fullMatch = match[0]
    const rootVariable = '#' + match[1].split('.')[0].split('?')[0]
    
    if (!fullMatch.startsWith('#invoicingItems[')) {
      variables.push(fullMatch)
      
      if (rootVariable === '#invoicingItems' || rootVariable === '#input' || rootVariable === '#item') {
        // #invoicingItems[...] is handled by invoicingItemPattern
        // #input is always available
        // #item is available in array item mappings
      } else if (!knownVariables.has(rootVariable) && !knownVariables.has(fullMatch)) {
        warnings.push(`Unknown variable: '${fullMatch}'`)
      }
    }
  }

  // Check for common mistakes
  if (expression.includes('??') && !expression.includes('?:')) {
    warnings.push('Double question mark (??) is not standard SpEL, use ?: for elvis operator')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    variables: Array.from(new Set(variables)),
  }
}

export function extractVariablesFromExpression(expression: string): string[] {
  const variables = new Set<string>()
  
  // Match all variables starting with #
  const pattern = /#(\w+(?:\.\w+|\[['"][^\]]+['"]\])*(?:\??\.\w+)*)/g
  let match
  
  while ((match = pattern.exec(expression)) !== null) {
    variables.add('#' + match[1])
  }
  
  return Array.from(variables)
}
