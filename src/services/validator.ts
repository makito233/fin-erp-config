import type { SapConfig, ValidationError, FieldMapping, InvoicingItem, MetadataVariable } from '@/types'
import { validateSpelExpression } from './spel-validator'

const VALID_FIELD_TYPES = ['string', 'optional_string', 'double', 'local_date_time', 'optional_local_date_time', 'array']
const DATE_TIME_TYPES = ['local_date_time', 'optional_local_date_time']

export function validateConfig(
  config: SapConfig,
  invoicingItems: InvoicingItem[],
  metadataVariables: MetadataVariable[]
): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate field mappings
  Object.entries(config.fieldMappings).forEach(([fieldName, mapping]) => {
    errors.push(...validateFieldMapping(fieldName, mapping, invoicingItems, metadataVariables))
  })

  // Validate condition mappings
  config.conditionMappings.forEach((condMapping, index) => {
    errors.push(...validateConditionMapping(condMapping, index, invoicingItems, metadataVariables))
  })

  // Check for duplicate condition types
  const conditionTypes = config.conditionMappings.map(c => c.conditionType)
  const duplicates = conditionTypes.filter((type, index) => conditionTypes.indexOf(type) !== index)
  duplicates.forEach(type => {
    errors.push({
      id: `duplicate-condition-${type}`,
      severity: 'warning',
      message: `Duplicate condition type: ${type}`,
      location: { conditionType: type }
    })
  })

  return errors
}

function validateFieldMapping(
  fieldName: string,
  mapping: FieldMapping,
  invoicingItems: InvoicingItem[],
  metadataVariables: MetadataVariable[]
): ValidationError[] {
  const errors: ValidationError[] = []

  // Validate type
  if (!VALID_FIELD_TYPES.includes(mapping.type)) {
    errors.push({
      id: `invalid-type-${fieldName}`,
      severity: 'error',
      message: `Invalid field type: ${mapping.type}. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
      field: fieldName,
      location: { fieldName }
    })
  }

  // Validate format for date-time types
  if (DATE_TIME_TYPES.includes(mapping.type) && !mapping.format) {
    errors.push({
      id: `missing-format-${fieldName}`,
      severity: 'error',
      message: `Field type ${mapping.type} requires a format`,
      field: fieldName,
      location: { fieldName }
    })
  }

  // Validate expressions by country
  if (!mapping.expressionsByCountry || mapping.expressionsByCountry.length === 0) {
    errors.push({
      id: `no-expressions-${fieldName}`,
      severity: 'error',
      message: 'No country expressions defined',
      field: fieldName,
      location: { fieldName }
    })
  } else {
    mapping.expressionsByCountry.forEach((countryExpr, index) => {
      if (!countryExpr.countries || countryExpr.countries.length === 0) {
        errors.push({
          id: `no-countries-${fieldName}-${index}`,
          severity: 'error',
          message: 'No countries specified for expression',
          field: fieldName,
          location: { fieldName }
        })
      }

      if (!countryExpr.expression || countryExpr.expression.trim() === '') {
        errors.push({
          id: `empty-expression-${fieldName}-${index}`,
          severity: 'error',
          message: 'Empty expression',
          field: fieldName,
          location: { fieldName, country: countryExpr.countries?.join(', ') }
        })
      } else {
        // Validate SpEL expression
        const spelResult = validateSpelExpression(
          countryExpr.expression,
          invoicingItems,
          metadataVariables
        )

        spelResult.errors.forEach(err => {
          errors.push({
            id: `spel-error-${fieldName}-${index}`,
            severity: 'error',
            message: `SpEL error: ${err}`,
            field: fieldName,
            location: { fieldName, country: countryExpr.countries?.join(', ') }
          })
        })

        spelResult.warnings.forEach(warn => {
          errors.push({
            id: `spel-warning-${fieldName}-${index}`,
            severity: 'warning',
            message: `SpEL warning: ${warn}`,
            field: fieldName,
            location: { fieldName, country: countryExpr.countries?.join(', ') }
          })
        })
      }
    })
  }

  // Validate nested itemsMappings for array types
  if (mapping.type === 'array' && mapping.itemsMappings) {
    Object.entries(mapping.itemsMappings).forEach(([itemField, itemMapping]) => {
      errors.push(...validateFieldMapping(
        `${fieldName}.${itemField}`,
        itemMapping,
        invoicingItems,
        metadataVariables
      ))
    })
  }

  return errors
}

function validateConditionMapping(
  mapping: any,
  index: number,
  invoicingItems: InvoicingItem[],
  metadataVariables: MetadataVariable[]
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!mapping.conditionType) {
    errors.push({
      id: `no-condition-type-${index}`,
      severity: 'error',
      message: 'Missing conditionType',
      location: { conditionType: `condition-${index}` }
    })
  }

  if (!mapping.expressionsByCountry || mapping.expressionsByCountry.length === 0) {
    errors.push({
      id: `no-expressions-condition-${index}`,
      severity: 'error',
      message: 'No country expressions defined',
      location: { conditionType: mapping.conditionType }
    })
  } else {
    mapping.expressionsByCountry.forEach((countryExpr: any, exprIndex: number) => {
      if (!countryExpr.countries || countryExpr.countries.length === 0) {
        errors.push({
          id: `no-countries-condition-${index}-${exprIndex}`,
          severity: 'error',
          message: 'No countries specified for expression',
          location: { conditionType: mapping.conditionType }
        })
      }

      if (!countryExpr.expression || countryExpr.expression.trim() === '') {
        errors.push({
          id: `empty-expression-condition-${index}-${exprIndex}`,
          severity: 'error',
          message: 'Empty expression',
          location: { conditionType: mapping.conditionType, country: countryExpr.countries?.join(', ') }
        })
      } else {
        // Validate SpEL expression
        const spelResult = validateSpelExpression(
          countryExpr.expression,
          invoicingItems,
          metadataVariables
        )

        spelResult.errors.forEach(err => {
          errors.push({
            id: `spel-error-condition-${index}-${exprIndex}`,
            severity: 'error',
            message: `SpEL error: ${err}`,
            location: { conditionType: mapping.conditionType, country: countryExpr.countries?.join(', ') }
          })
        })

        spelResult.warnings.forEach(warn => {
          errors.push({
            id: `spel-warning-condition-${index}-${exprIndex}`,
            severity: 'warning',
            message: `SpEL warning: ${warn}`,
            location: { conditionType: mapping.conditionType, country: countryExpr.countries?.join(', ') }
          })
        })
      }
    })
  }

  return errors
}

