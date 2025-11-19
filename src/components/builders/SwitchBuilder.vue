<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElInput, ElButton, ElAutocomplete, ElDialog, ElTooltip, ElCard } from 'element-plus'
import { Plus, Delete, MagicStick } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import SumBuilder from './SumBuilder.vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const configStore = useConfigStore()

// State
const discriminator = ref('#input.orderMetadata?.handlingStrategy')
const defaultValue = ref('0')
const cases = ref<Array<{ key: string; value: string }>>([])

// Nested builder state
const showNestedBuilder = ref(false)
const currentCaseIndex = ref(-1)
const nestedBuilderValue = ref('')

// Suggestions for discriminator
const querySearch = (queryString: string, cb: (results: any[]) => void) => {
  const results: any[] = []
  
  // Add metadata variables
  configStore.metadataVariables.forEach(v => {
    results.push({ value: `#input.orderMetadata?.${v.name}`, link: v.name })
  })
  
  // Add common ones if not present
  if (!results.some(r => r.value.includes('handlingStrategy'))) {
    results.unshift({ value: '#input.orderMetadata?.handlingStrategy', link: 'handlingStrategy' })
  }
  
  // Filter
  const filtered = queryString 
    ? results.filter(r => r.value.toLowerCase().includes(queryString.toLowerCase()))
    : results
    
  cb(filtered)
}

// Parsing Logic
function parseExpression(expr: string) {
  if (!expr || !expr.trim()) return

  // Pattern: { 'KEY': VAL, ... }[#var] ?: DEFAULT
  // or just { ... }[#var]
  
  // 1. Extract Default Value (?: ...)
  let content = expr.trim()
  const defaultMatch = content.match(/\]\s*\?:\s*(.+)$/)
  if (defaultMatch) {
    defaultValue.value = defaultMatch[1].trim()
    // Remove the default part from content
    content = content.substring(0, content.lastIndexOf(']')) + ']'
  }
  
  // 2. Extract Discriminator ([...])
  const discMatch = content.match(/\}\[(.+)\]$/)
  if (discMatch) {
    discriminator.value = discMatch[1].trim()
    // Remove discriminator
    content = content.substring(0, content.lastIndexOf('}')) + '}'
  }
  
  // 3. Extract Cases ({ ... })
  // Remove outer braces
  if (content.startsWith('{') && content.endsWith('}')) {
    const body = content.substring(1, content.length - 1).trim()
    
    // Split by comma, but respect parentheses
    // Regex to find 'KEY': VAL
    // We iterate through the string manually to handle nested structures
    
    const newCases: Array<{ key: string; value: string }> = []
    const parts = body.split(/,(?=\s*['"])/) // Split by comma followed by quote (start of next key)
    
    parts.forEach(part => {
        const keyMatch = part.match(/^\s*['"]([^'"]+)['"]\s*:\s*(.+)/s)
        if (keyMatch) {
            newCases.push({
                key: keyMatch[1],
                value: keyMatch[2].trim()
            })
        }
    })
    
    if (newCases.length > 0) {
        cases.value = newCases
    }
  }
}

function generateExpression() {
  if (cases.value.length === 0) return ''
  
  const casesStr = cases.value
    .map(c => `'${c.key}': ${c.value || '0'}`)
    .join(',\n  ')
    
  return `{\n  ${casesStr}\n}[${discriminator.value}] ?: ${defaultValue.value}`
}

// Watchers
watch([discriminator, defaultValue, cases], () => {
  emit('update:modelValue', generateExpression())
}, { deep: true })

onMounted(() => {
  parseExpression(props.modelValue)
})

// Actions
function addCase() {
  cases.value.push({ key: '', value: '0' })
}

function removeCase(index: number) {
  cases.value.splice(index, 1)
}

function openBuilderForCase(index: number) {
  currentCaseIndex.value = index
  nestedBuilderValue.value = cases.value[index].value
  // Strip outer parens if present, as SumBuilder adds them?
  // SumBuilder handles input robustly.
  showNestedBuilder.value = true
}

function applyNestedBuilder(val: string) {
  if (currentCaseIndex.value !== -1) {
    cases.value[currentCaseIndex.value].value = val
  }
}
</script>

<template>
  <div class="switch-builder">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Discriminator Variable</label>
      <ElAutocomplete
        v-model="discriminator"
        :fetch-suggestions="querySearch"
        placeholder="#input.orderMetadata?.handlingStrategy"
        class="w-full"
        clearable
      >
        <template #default="{ item }">
          <div class="value">{{ item.value }}</div>
        </template>
      </ElAutocomplete>
      <p class="text-xs text-gray-500 mt-1">Select the variable to switch on (e.g. handlingStrategy)</p>
    </div>

    <div class="cases-container mb-4">
      <div class="flex justify-between items-center mb-2">
        <label class="text-sm font-medium text-gray-700">Cases</label>
        <ElButton size="small" :icon="Plus" @click="addCase">Add Case</ElButton>
      </div>
      
      <div class="cases-list space-y-3">
        <ElCard 
          v-for="(item, index) in cases" 
          :key="index" 
          shadow="never"
          class="case-card"
          :body-style="{ padding: '12px' }"
        >
          <div class="flex gap-3 items-start">
            <div class="w-1/4">
              <label class="text-xs text-gray-500 mb-1 block">Case Key</label>
              <ElInput v-model="item.key" placeholder="e.g. GEN1" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500 mb-1 block">Value Expression</label>
              <div class="flex gap-2">
                <ElInput 
                  v-model="item.value" 
                  type="textarea" 
                  :rows="2" 
                  placeholder="Expression"
                  class="font-mono text-sm"
                />
                <div class="flex flex-col gap-1">
                    <ElTooltip content="Use Visual Builder">
                        <ElButton 
                            circle 
                            size="small" 
                            type="primary" 
                            plain
                            :icon="MagicStick"
                            @click="openBuilderForCase(index)"
                        />
                    </ElTooltip>
                    <ElTooltip content="Remove Case">
                        <ElButton 
                            circle 
                            size="small" 
                            type="danger" 
                            plain
                            :icon="Delete" 
                            @click="removeCase(index)"
                        />
                    </ElTooltip>
                </div>
              </div>
            </div>
          </div>
        </ElCard>
      </div>
      
      <div v-if="cases.length === 0" class="text-center p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-500">
        No cases defined. Add a case to start.
      </div>
    </div>

    <div class="default-value-section">
      <label class="block text-sm font-medium text-gray-700 mb-1">Default Value (Fallback)</label>
      <ElInput v-model="defaultValue" placeholder="0" />
    </div>
    
    <!-- Nested Builder Dialog -->
    <ElDialog
      v-model="showNestedBuilder"
      title="Build Value Expression"
      width="800px"
      append-to-body
      align-center
    >
      <SumBuilder 
        v-if="showNestedBuilder"
        :model-value="nestedBuilderValue"
        @update:model-value="(val) => nestedBuilderValue = val"
      />
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="showNestedBuilder = false">Cancel</ElButton>
          <ElButton type="primary" @click="() => { applyNestedBuilder(nestedBuilderValue); showNestedBuilder = false; }">
            Apply
          </ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.switch-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 0.5rem;
}
</style>

