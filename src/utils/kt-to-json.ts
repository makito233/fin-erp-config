import fs from 'fs'
import path from 'path'

interface InvoicingItem {
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

function parseKotlinEnum(content: string): InvoicingItem[] {
  const items: InvoicingItem[] = []
  
  // Match all enum declarations (OrderInvoicingItem, PrimeSubscriptionInvoicingItem, etc.)
  const enumPattern = /enum class (\w+)\([^)]+\) : InvoicingItemDefinition \{([\s\S]*?)override val sourceType: SourceType = SourceType\.(\w+)/g
  
  let enumMatch
  while ((enumMatch = enumPattern.exec(content)) !== null) {
    const sourceType = enumMatch[3]
    const enumBody = enumMatch[2]
    
    // Extract individual enum items
    const itemPattern = /(\w+)\(\s*from\s*=\s*ActorType\.(\w+),\s*to\s*=\s*ActorType\.(\w+),\s*issuer\s*=\s*ActorType\.(\w+),\s*recipient\s*=\s*ActorType\.(\w+),\s*amountType\s*=\s*AmountType\.(\w+),\s*taxation\s*=\s*Taxation\.(\w+),\s*description\s*=\s*"([^"]+(?:"[^"]*"[^"]*)*?)"\s*,?\s*\)/gs
    
    let itemMatch
    while ((itemMatch = itemPattern.exec(enumBody)) !== null) {
      const item: InvoicingItem = {
        name: itemMatch[1],
        sourceType,
        from: itemMatch[2],
        to: itemMatch[3],
        issuer: itemMatch[4],
        recipient: itemMatch[5],
        amountType: itemMatch[6],
        taxation: itemMatch[7],
        description: itemMatch[8].replace(/\s+/g, ' ').trim()
      }
      items.push(item)
    }
  }
  
  return items
}

function main() {
  try {
    const ktFilePath = path.join(process.cwd(), 'examples', 'InvoicingItemDefinition.kt')
    const outputPath = path.join(process.cwd(), 'public', 'data', 'invoicing-items.json')
    
    console.log('Reading Kotlin file from:', ktFilePath)
    const content = fs.readFileSync(ktFilePath, 'utf-8')
    
    console.log('Parsing Kotlin enums...')
    const items = parseKotlinEnum(content)
    
    console.log(`Found ${items.length} invoicing items`)
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // Write to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(items, null, 2))
    console.log('Successfully generated:', outputPath)
    
    // Show first few items for verification
    console.log('\nFirst 3 items:')
    items.slice(0, 3).forEach(item => {
      console.log(`- ${item.name} (${item.sourceType})`)
    })
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

