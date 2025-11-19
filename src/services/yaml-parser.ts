import yaml from 'js-yaml'
import type { SapConfig } from '@/types'

export function parseYamlToConfig(yamlContent: string): SapConfig {
  try {
    const parsed = yaml.load(yamlContent, {
      schema: yaml.DEFAULT_SCHEMA,
    }) as any

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML: Expected an object at root level')
    }

    if (!parsed.fieldMappings) {
      throw new Error('Invalid YAML: Missing fieldMappings')
    }

    if (!parsed.conditionMappings) {
      throw new Error('Invalid YAML: Missing conditionMappings')
    }

    const config: SapConfig = {
      fieldMappings: parsed.fieldMappings,
      conditionMappings: parsed.conditionMappings,
    }

    return config
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`YAML parsing error: ${error.message}`)
    }
    throw error
  }
}

export function serializeConfigToYaml(config: SapConfig): string {
  try {
    // Create the structure to serialize
    const output = {
      fieldMappings: config.fieldMappings,
      conditionMappings: config.conditionMappings,
    }

    // Use custom dump options for better formatting
    const yamlString = yaml.dump(output, {
      indent: 2,
      lineWidth: -1, // Disable line wrapping
      noRefs: true,
      sortKeys: false,
      flowLevel: -1,
      styles: {
        '!!null': 'empty',
      },
    })

    // Add header comment
    const header = `# A configuration file defining the mapping of order data into the SAP order payload format (JSON).
# Order payload is sent to SAP for invoicing and accounting purposes.
#
# Note: '>' converts newlines to spaces, making multi-line expressions more readable.

# Mapped 1:1 to the order payload JSON structure
# Possible types are:
# - string: string value mapped as-is and cannot be null.
# - optional_string: string value that can be null, in which case it will be sent as an empty string.
# - double: numeric value mapped with format "0.00" and cannot be null.
# - local_date_time: date-time value mapped with a specific format (e.g. "yyyy/MM/dd") and cannot be null.
# - optional_local_date_time: date-time value as above that can be null, in which case it will be sent as an empty string.
# - array: array of objects, with nested itemsMappings defining the structure of each object.
`

    return header + yamlString
  } catch (error) {
    throw new Error(`Failed to serialize config to YAML: ${error}`)
  }
}

export function validateYamlStructure(yamlContent: string): { valid: boolean; error?: string } {
  try {
    const parsed = yaml.load(yamlContent)
    
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'YAML must contain an object at root level' }
    }

    const config = parsed as any

    if (!config.fieldMappings || typeof config.fieldMappings !== 'object') {
      return { valid: false, error: 'Missing or invalid fieldMappings' }
    }

    if (!config.conditionMappings || !Array.isArray(config.conditionMappings)) {
      return { valid: false, error: 'Missing or invalid conditionMappings (must be an array)' }
    }

    return { valid: true }
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      return { valid: false, error: `YAML syntax error: ${error.message}` }
    }
    return { valid: false, error: String(error) }
  }
}

