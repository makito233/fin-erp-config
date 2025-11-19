<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  ElCollapse, 
  ElCollapseItem, 
  ElTag, 
  ElInput, 
  ElTabs, 
  ElTabPane,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
  ElPopconfirm
} from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import ExpressionEditor from './ExpressionEditor.vue'
import type { ConditionMapping, SupportedCountry } from '@/types'

const configStore = useConfigStore()
const searchQuery = ref('')
const activeCountry = ref('ES')
const supportedCountries = ref<SupportedCountry[]>([])

const showAddDialog = ref(false)
const newConditionType = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/data/supported-countries.json')
    supportedCountries.value = await response.json()
    if (supportedCountries.value.length > 0) {
      activeCountry.value = supportedCountries.value[0].code
    }
  } catch (error) {
    console.error('Failed to load supported countries', error)
    // Fallback
    supportedCountries.value = [
      { code: 'ES', status: 'live' },
      { code: 'PL', status: 'live' },
      { code: 'PT', status: 'draft' },
      { code: 'IT', status: 'draft' }
    ]
  }
})

const conditionMappings = computed(() => {
  if (!configStore.config) return []
  return configStore.config.conditionMappings
})

const filteredConditionMappings = computed(() => {
  if (!conditionMappings.value) return []
  
  const query = searchQuery.value.toLowerCase()
  
  return conditionMappings.value
    .map((mapping, index) => ({ mapping, originalIndex: index }))
    .filter(item => item.mapping.conditionType.toLowerCase().includes(query))
})

function getExpressionForCountry(mapping: ConditionMapping, country: string): string {
  const expr = mapping.expressionsByCountry.find(e => e.countries.includes(country))
  return expr ? expr.expression : ''
}

function updateExpressionForCountry(conditionIndex: number, country: string, newExpression: string) {
  if (!configStore.config) return
  
  const mapping = configStore.config.conditionMappings[conditionIndex]
  
  // Find existing expression entry for this country
  const existingExprIndex = mapping.expressionsByCountry.findIndex(e => e.countries.includes(country))
  
  if (existingExprIndex !== -1) {
    const existingExpr = mapping.expressionsByCountry[existingExprIndex]
    
    // If this entry only has this country, update directly
    if (existingExpr.countries.length === 1 && existingExpr.countries[0] === country) {
      existingExpr.expression = newExpression
    } else {
      // Split: remove country from existing, create new entry
      existingExpr.countries = existingExpr.countries.filter(c => c !== country)
      
      mapping.expressionsByCountry.push({
        countries: [country],
        expression: newExpression
      })
    }
  } else {
    // Create new entry
    mapping.expressionsByCountry.push({
      countries: [country],
      expression: newExpression
    })
  }
  
  configStore.updateConditionMapping(conditionIndex, mapping)
}

function addCondition() {
  if (!newConditionType.value.trim()) {
    ElMessage.warning('Please enter a condition type')
    return
  }

  const type = newConditionType.value.trim()

  // Camel case validation
  const camelCaseRegex = /^[a-z][a-zA-Z0-9]*$/
  if (!camelCaseRegex.test(type)) {
    ElMessage.warning('Condition type must be in camelCase (e.g. netTotalOrderValue)')
    return
  }
  
  // Check if exists
  if (configStore.config?.conditionMappings.some(c => c.conditionType === type)) {
    ElMessage.error(`Condition "${type}" already exists`)
    return
  }

  const newMapping: ConditionMapping = {
    conditionType: type,
    expressionsByCountry: []
  }

  configStore.addConditionMapping(newMapping)
  ElMessage.success(`Added condition "${type}"`)
  showAddDialog.value = false
  newConditionType.value = ''
  
  // Clear search to show new item
  searchQuery.value = ''
}

function deleteCondition(index: number) {
  configStore.removeConditionMapping(index)
  ElMessage.success('Condition removed')
}
</script>

<template>
  <div class="condition-mapping-section">
    <div class="section-header">
      <h2 class="text-xl font-semibold text-gray-900">Condition Mappings</h2>
      <p class="text-sm text-gray-600 mt-1">
        Configure conditions per country
      </p>
    </div>

    <div class="controls mb-4 flex gap-4">
      <ElInput
        v-model="searchQuery"
        placeholder="Search conditions..."
        :prefix-icon="Search"
        clearable
        class="flex-1"
      />
      <ElButton type="primary" :icon="Plus" @click="showAddDialog = true">
        New Condition
      </ElButton>
    </div>

    <div v-if="conditionMappings.length === 0" class="empty-state">
      <p class="text-gray-500">No condition mappings loaded. Please upload a configuration file.</p>
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

          <div v-if="filteredConditionMappings.length === 0" class="empty-search text-center p-4 text-gray-500">
            No conditions match your search.
          </div>

          <ElCollapse v-else class="mappings-list" accordion>
            <ElCollapseItem
              v-for="item in filteredConditionMappings"
              :key="`condition-${item.originalIndex}-${country.code}`"
              :name="`condition-${item.originalIndex}`"
            >
              <template #title>
                <div class="condition-title">
                  <span class="condition-type">{{ item.mapping.conditionType }}</span>
                  <ElTag size="small" class="ml-2" effect="plain">
                    {{ country.code }}
                  </ElTag>
                  
                  <div class="ml-auto mr-4" @click.stop>
                    <ElPopconfirm
                      title="Are you sure to delete this condition?"
                      @confirm="deleteCondition(item.originalIndex)"
                      width="220"
                      confirm-button-text="Delete"
                      confirm-button-type="danger"
                      cancel-button-text="Cancel"
                    >
                      <template #reference>
                        <ElButton 
                          type="danger" 
                          link 
                          :icon="Delete"
                          size="small"
                        />
                      </template>
                    </ElPopconfirm>
                  </div>
                </div>
              </template>

              <div class="condition-content">
                <div class="expression-container">
                  <label class="text-xs text-gray-600 mb-1 block">Expression for {{ country.code }}:</label>
                  <ExpressionEditor
                    :model-value="getExpressionForCountry(item.mapping, country.code)"
                    @update:model-value="(val) => updateExpressionForCountry(item.originalIndex, country.code, val)"
                    :rows="6"
                  />
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- Add Condition Dialog -->
    <ElDialog
      v-model="showAddDialog"
      title="Add New Condition"
      width="400px"
      align-center
    >
      <ElForm @submit.prevent="addCondition">
        <ElFormItem label="Condition Type">
          <ElInput 
            v-model="newConditionType" 
            placeholder="e.g. netTotalOrderValue" 
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="showAddDialog = false">Cancel</ElButton>
          <ElButton type="primary" @click="addCondition">
            Add
          </ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.condition-mapping-section {
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

.condition-title {
  display: flex;
  align-items: center;
  flex: 1;
  /* Ensure title takes full width to push delete button to right */
  width: 100%; 
}

.condition-type {
  font-weight: 600;
  color: #1f2937;
  padding-left: 1rem;
}

.condition-content {
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
</style>
