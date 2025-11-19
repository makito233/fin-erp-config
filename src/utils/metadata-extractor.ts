import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

interface MetadataVariable {
  name: string
  type: string
  description: string
  examples: string[]
}

function extractVariablesFromExpression(expression: string): Set<string> {
  const variables = new Set<string>()
  
  // Match variables starting with #
  const variablePattern = /#(\w+(?:\.\w+|\[['"][^\]]+['"]\])*(?:\??\.\w+)*)/g
  
  let match
  while ((match = variablePattern.exec(expression)) !== null) {
    variables.add('#' + match[1])
  }
  
  return variables
}

function categorizeVariable(variable: string): { type: string; description: string } {
  if (variable.startsWith('#invoicingItems[')) {
    return {
      type: 'invoicing_item',
      description: 'Reference to an invoicing item with amount values'
    }
  } else if (variable.startsWith('#input.orderMetadata')) {
    return {
      type: 'order_metadata',
      description: 'Order metadata field from the input'
    }
  } else if (variable.startsWith('#input.operation')) {
    return {
      type: 'operation',
      description: 'Operation type (e.g., cancel, complete)'
    }
  } else if (variable.startsWith('#input.processingTime')) {
    return {
      type: 'processing_time',
      description: 'When the order was processed'
    }
  } else if (variable.startsWith('#input.')) {
    return {
      type: 'input_field',
      description: 'Input field from order data'
    }
  } else if (variable.endsWith('CountryCodeValue') || variable.endsWith('CodeValue')) {
    return {
      type: 'context_value',
      description: 'Context value computed from order data'
    }
  } else if (variable.startsWith('#is')) {
    return {
      type: 'boolean_flag',
      description: 'Boolean flag derived from order properties'
    }
  } else {
    return {
      type: 'unknown',
      description: 'Variable extracted from expressions'
    }
  }
}

function extractMetadataFromYaml(yamlContent: any): MetadataVariable[] {
  const variableMap = new Map<string, { type: string; description: string; examples: Set<string> }>()
  
  function processExpressions(obj: any) {
    if (typeof obj === 'string') {
      const vars = extractVariablesFromExpression(obj)
      vars.forEach(v => {
        if (!variableMap.has(v)) {
          const category = categorizeVariable(v)
          // Skip invoicing items as they are listed separately
          // Also skip local loop variables (starting with #item)
          if (category.type === 'invoicing_item' || v.startsWith('#item.')) {
            return
          }
          
          variableMap.set(v, {
            type: category.type,
            description: category.description,
            examples: new Set([obj.substring(0, 100)])
          })
        } else {
          const existing = variableMap.get(v)!
          if (existing.examples.size < 3) {
            existing.examples.add(obj.substring(0, 100))
          }
        }
      })
    } else if (Array.isArray(obj)) {
      obj.forEach(processExpressions)
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(processExpressions)
    }
  }
  
  processExpressions(yamlContent)
  
  return Array.from(variableMap.entries()).map(([name, data]) => ({
    name,
    type: data.type,
    description: data.description,
    examples: Array.from(data.examples)
  })).sort((a, b) => a.name.localeCompare(b.name))
}

function main() {
  try {
    const yamlFilePath = path.join(process.cwd(), 'examples', 'sap-order-payload-mapping.yml')
    const outputPath = path.join(process.cwd(), 'public', 'data', 'metadata-variables.json')
    
    console.log('Reading YAML file from:', yamlFilePath)
    const content = fs.readFileSync(yamlFilePath, 'utf-8')
    const yamlData = yaml.load(content)
    
    console.log('Extracting metadata variables...')
    const variables = extractMetadataFromYaml(yamlData)
    
    console.log(`Found ${variables.length} unique metadata variables`)
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Write to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(variables, null, 2))
    console.log('Successfully generated:', outputPath)
    
    // Show statistics by type
    const typeCount = variables.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\nVariables by type:')
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`)
    })
    
    console.log('\nFirst 5 variables:')
    variables.slice(0, 5).forEach(v => {
      console.log(`- ${v.name} (${v.type})`)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

