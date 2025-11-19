<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElCard, ElSelect, ElOption, ElTable, ElTableColumn, ElButton, ElEmpty, ElTag, ElMessage } from 'element-plus'
import type { SapConfig, FieldMapping, ConditionMapping, MetadataVariable } from '@/types'

interface RfcRow {
  fieldName: string
  mandatory: boolean
  dataType: string
  literal: string
}

const props = defineProps<{
  config: SapConfig | null
  metadataVariables: MetadataVariable[]
  supportedCountries: string[]
  selectedCountry: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedCountry', value: string): void
}>()

const country = ref(
  props.selectedCountry ||
    (props.supportedCountries && props.supportedCountries.length > 0 ? props.supportedCountries[0] : '')
)

watch(
  () => props.selectedCountry,
  (newVal) => {
    if (newVal) {
      country.value = newVal
    }
  }
)

watch(
  () => props.supportedCountries,
  (newList) => {
    if (!country.value && newList.length > 0) {
      country.value = newList[0]
    }
  },
  { immediate: true }
)

watch(
  country,
  (newVal) => {
    if (newVal && newVal !== props.selectedCountry) {
      emit('update:selectedCountry', newVal)
    }
  }
)

const rows = computed<RfcRow[]>(() => {
  if (!props.config || !country.value) {
    return []
  }

  const list: RfcRow[] = []

  Object.entries(props.config.fieldMappings).forEach(([name, mapping]) => {
    list.push(...buildFieldRows(name, mapping, country.value))
  })

  props.config.conditionMappings.forEach((mapping) => {
    list.push(buildConditionRow(mapping, country.value))
  })

  return list
})

function buildFieldRows(fieldName: string, mapping: FieldMapping, countryCode: string, parentPath?: string): RfcRow[] {
  const rows: RfcRow[] = []
  const path = parentPath ? `${parentPath}.${fieldName}` : fieldName
  const expression = getExpressionForCountry(mapping.expressionsByCountry, countryCode)

  rows.push({
    fieldName: path,
    mandatory: isMandatory(mapping.type),
    dataType: describeType(mapping),
    literal: extractLiteral(expression)
  })

  if (mapping.type === 'array' && mapping.itemsMappings) {
    Object.entries(mapping.itemsMappings).forEach(([childName, childMapping]) => {
      rows.push(...buildFieldRows(childName, childMapping, countryCode, path))
    })
  }

  return rows
}

function buildConditionRow(mapping: ConditionMapping, countryCode: string): RfcRow {
  const expression = getExpressionForCountry(mapping.expressionsByCountry, countryCode)
  return {
    fieldName: `Condition: ${mapping.conditionType}`,
    mandatory: true,
    dataType: 'double',
    literal: extractLiteral(expression)
  }
}

function getExpressionForCountry(expressions: FieldMapping['expressionsByCountry'], countryCode: string): string {
  const expr = expressions.find(entry => entry.countries.includes(countryCode))
  return expr?.expression ?? 'Not configured'
}

function isMandatory(type: FieldMapping['type']): boolean {
  return !type.startsWith('optional_')
}

function describeType(mapping: FieldMapping): string {
  switch (mapping.type) {
    case 'string':
      return 'String'
    case 'optional_string':
      return 'String (optional)'
    case 'double':
      return 'Double'
    case 'local_date_time':
      return `DateTime (${mapping.format || 'ISO'})`
    case 'optional_local_date_time':
      return `DateTime (${mapping.format || 'ISO'}, optional)`
    case 'array':
      return 'Array'
    default:
      return mapping.type
  }
}

function extractLiteral(expression: string): string {
  if (!expression || expression === 'Not configured') {
    return 'Not configured'
  }

  const invoiceMatches = Array.from(expression.matchAll(/invoicingItems\[['"]([^'"]+)['"]\]/g)).map(match => match[1])
  if (invoiceMatches.length) {
    return Array.from(new Set(invoiceMatches)).join(', ')
  }

  const metadataMatches = props.metadataVariables
    .map(variable => variable.name)
    .filter(name => expression.includes(name))

  if (metadataMatches.length) {
    return Array.from(new Set(metadataMatches)).join(', ')
  }

  const inputMatch = expression.match(/#input\.[\w.?]+/)
  if (inputMatch) {
    return inputMatch[0]
  }

  return expression.slice(0, 80)
}

function downloadCsv() {
  if (rows.value.length === 0) {
    ElMessage.warning('Nothing to export. Load a configuration first.')
    return
  }

  const header = ['Payload Field Name', 'Mandatory', 'Data Type', 'O2C literal']
  const csvLines = [
    header.join(',')
  ]

  rows.value.forEach(row => {
    csvLines.push([
      csvEscape(row.fieldName),
      row.mandatory ? 'True' : 'False',
      csvEscape(row.dataType),
      csvEscape(row.literal)
    ].join(','))
  })

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rfc-${country.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function csvEscape(value: string): string {
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n')
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}
</script>

<template>
  <ElCard class="rfc-generator h-full flex flex-col" :body-style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }">
    <div class="header flex justify-between items-center mb-4">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">Country:</label>
        <ElSelect
          v-model="country"
          placeholder="Select country"
          style="width: 200px"
          :disabled="!supportedCountries.length"
        >
          <ElOption
            v-for="code in supportedCountries"
            :key="code"
            :label="code"
            :value="code"
          />
        </ElSelect>
      </div>

      <ElButton type="primary" @click="downloadCsv" :disabled="rows.length === 0">
        Download CSV
      </ElButton>
    </div>

    <div class="table-container flex-1 overflow-auto">
      <ElTable
        v-if="rows.length > 0"
        :data="rows"
        border
        size="small"
        height="100%"
      >
        <ElTableColumn prop="fieldName" label="Payload Field Name" min-width="220" show-overflow-tooltip />
        <ElTableColumn prop="mandatory" label="Mandatory" width="120">
          <template #default="{ row }">
            <ElTag :type="row.mandatory ? 'danger' : 'info'">
              {{ row.mandatory ? 'True' : 'False' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="dataType" label="Data Type" min-width="180" show-overflow-tooltip />
        <ElTableColumn prop="literal" label="O2C Literal" min-width="240" show-overflow-tooltip />
      </ElTable>

      <div v-else class="h-full flex items-center justify-center">
        <ElEmpty description="Load a configuration to preview the RFC data" />
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.rfc-generator {
  height: 100%;
}

.table-container {
  flex: 1;
}
</style>


