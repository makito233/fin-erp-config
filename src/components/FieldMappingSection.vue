<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElTag, ElCollapse, ElCollapseItem, ElTabs, ElTabPane } from 'element-plus'
import { useConfigStore } from '@/stores/config-store'
import ExpressionEditor from './ExpressionEditor.vue'
import type { FieldMapping, SupportedCountry } from '@/types'

const configStore = useConfigStore()
const activeCountry = ref('ES')
const supportedCountries = ref<SupportedCountry[]>([])

onMounted(async () => {
  try {
    const response = await fetch('/data/supported-countries.json')
    supportedCountries.value = await response.json()
    if (supportedCountries.value.length > 0) {
      activeCountry.value = supportedCountries.value[0].code
    }
  } catch (error) {
    console.error('Failed to load supported countries', error)
    supportedCountries.value = [
      { code: 'ES', status: 'live' },
      { code: 'PL', status: 'live' },
      { code: 'PT', status: 'draft' },
      { code: 'IT', status: 'draft' }
    ]
  }
})

const fieldMappings = computed(() => {
  if (!configStore.config) return []
  return Object.entries(configStore.config.fieldMappings).map(([name, mapping]) => ({
    name,
    ...mapping
  }))
})

function getExpressionForCountry(mapping: FieldMapping, country: string): string {
  const expr = mapping.expressionsByCountry.find(e => e.countries.includes(country))
  return expr ? expr.expression : ''
}

function updateExpressionForCountry(fieldName: string, country: string, newExpression: string) {
  if (!configStore.config) return
  
  const mapping = configStore.config.fieldMappings[fieldName]
  const existingExprIndex = mapping.expressionsByCountry.findIndex(e => e.countries.includes(country))
  
  if (existingExprIndex !== -1) {
    const existingExpr = mapping.expressionsByCountry[existingExprIndex]
    if (existingExpr.countries.length === 1 && existingExpr.countries[0] === country) {
      existingExpr.expression = newExpression
    } else {
      existingExpr.countries = existingExpr.countries.filter(c => c !== country)
      mapping.expressionsByCountry.push({
        countries: [country],
        expression: newExpression
      })
    }
  } else {
    mapping.expressionsByCountry.push({
      countries: [country],
      expression: newExpression
    })
  }
  
  configStore.updateFieldMapping(fieldName, mapping)
}

function updateNestedExpressionForCountry(fieldName: string, itemName: string, country: string, newExpression: string) {
  if (!configStore.config) return
  
  const mapping = configStore.config.fieldMappings[fieldName]
  if (!mapping.itemsMappings || !mapping.itemsMappings[itemName]) return
  
  const itemMapping = mapping.itemsMappings[itemName]
  const existingExprIndex = itemMapping.expressionsByCountry.findIndex(e => e.countries.includes(country))
  
  if (existingExprIndex !== -1) {
    const existingExpr = itemMapping.expressionsByCountry[existingExprIndex]
    if (existingExpr.countries.length === 1 && existingExpr.countries[0] === country) {
      existingExpr.expression = newExpression
    } else {
      existingExpr.countries = existingExpr.countries.filter(c => c !== country)
      itemMapping.expressionsByCountry.push({
        countries: [country],
        expression: newExpression
      })
    }
  } else {
    itemMapping.expressionsByCountry.push({
      countries: [country],
      expression: newExpression
    })
  }
  
  configStore.updateFieldMapping(fieldName, mapping)
}

function getTypeColor(type: string): 'success' | 'info' | 'warning' | 'danger' | 'primary' | undefined {
  switch (type) {
    case 'string': return 'success'
    case 'optional_string': return 'info'
    case 'double': return 'warning'
    case 'local_date_time': return 'danger'
    case 'array': return 'primary'
    default: return undefined
  }
}
</script>

<template>
  <div class="field-mapping-section">
    <div class="section-header">
      <h2 class="text-xl font-semibold text-gray-900">Field Mappings</h2>
      <p class="text-sm text-gray-600 mt-1">
        Configure how order data fields map to SAP payload fields per country
      </p>
    </div>

    <div v-if="fieldMappings.length === 0" class="empty-state">
      <p class="text-gray-500">No field mappings loaded. Please upload a configuration file.</p>
    </div>

    <div v-else>
      <ElTabs v-model="activeCountry" type="card" class="country-tabs">
        <ElTabPane
          v-for="country in supportedCountries"
          :key="country.code"
          :name="country.code"
        >
          <template #label>
            <span class="flex items-center gap-2">
              {{ country.code }}
              <span 
                class="w-2 h-2 rounded-full"
                :class="country.status === 'live' ? 'bg-green-500' : 'bg-gray-300'"
                :title="country.status === 'live' ? 'Live' : 'Draft'"
              ></span>
            </span>
          </template>

          <ElCollapse class="mappings-list" accordion>
            <ElCollapseItem
              v-for="field in fieldMappings"
              :key="field.name"
              :name="field.name"
            >
              <template #title>
                <div class="field-title">
                  <span class="field-name">{{ field.name }}</span>
                  <ElTag :type="getTypeColor(field.type)" size="small" class="ml-2">
                    {{ field.type }}
                  </ElTag>
                  <ElTag size="small" class="ml-1" effect="plain">
                    {{ country.code }}
                  </ElTag>
                </div>
              </template>

              <div class="field-content">
                <div class="expression-container mb-4">
                  <label class="text-xs text-gray-600 mb-1 block">Expression for {{ country.code }}:</label>
                  <ExpressionEditor
                    :model-value="getExpressionForCountry(field, country.code)"
                    @update:model-value="(val) => updateExpressionForCountry(field.name, country.code, val)"
                    :rows="4"
                  />
                </div>

                <div v-if="field.itemsMappings" class="nested-mappings mt-4">
                  <div class="nested-header">
                    <h4 class="text-sm font-semibold text-gray-800">Nested Item Mappings</h4>
                  </div>
                  <div class="nested-items">
                    <div
                      v-for="(itemMapping, itemName) in field.itemsMappings"
                      :key="itemName"
                      class="nested-item p-3 bg-gray-50 rounded mb-2"
                    >
                      <div class="flex items-center mb-2">
                        <span class="font-medium text-gray-700">{{ itemName }}</span>
                        <ElTag :type="getTypeColor(itemMapping.type)" size="small" class="ml-2">
                          {{ itemMapping.type }}
                        </ElTag>
                      </div>
                      <div class="nested-expression">
                        <ExpressionEditor
                          :model-value="getExpressionForCountry(itemMapping, country.code)"
                          @update:model-value="(val) => updateNestedExpressionForCountry(field.name, itemName, country.code, val)"
                          :rows="2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<style scoped>
.field-mapping-section {
  padding: 1.5rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  background-color: #f9fafb;
  border-radius: 8px;
}

.mappings-list {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.field-title {
  display: flex;
  align-items: center;
  flex: 1;
}

.field-name {
  font-weight: 600;
  color: #1f2937;
  padding-left: 1rem;
}

.field-content {
  padding: 1rem;
  background-color: #f9fafb;
}

.country-expression {
  padding: 1rem;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.country-header {
  display: flex;
  align-items: center;
}

.expression-container {
  width: 100%;
}

.nested-mappings {
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
}

.nested-header {
  margin-bottom: 0.75rem;
}

.nested-item {
  border: 1px solid #e5e7eb;
}
</style>

