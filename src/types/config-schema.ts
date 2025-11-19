export type FieldType = 
  | 'string' 
  | 'optional_string' 
  | 'double' 
  | 'local_date_time' 
  | 'optional_local_date_time' 
  | 'array'

export interface CountryExpression {
  countries: string[]
  expression: string
}

export interface FieldMapping {
  type: FieldType
  format?: string
  expressionsByCountry: CountryExpression[]
  itemsMappings?: Record<string, FieldMapping>
}

export interface ConditionMapping {
  conditionType: string
  expressionsByCountry: CountryExpression[]
}

export interface SapConfig {
  fieldMappings: Record<string, FieldMapping>
  conditionMappings: ConditionMapping[]
}

export interface SupportedCountry {
  code: string
  status: 'live' | 'draft'
}

export interface MetadataVariable {
  name: string
  type: string
  description: string
  examples: string[]
}

export interface ValidationError {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
  field?: string
  location?: {
    fieldName?: string
    conditionType?: string
    country?: string
  }
}

