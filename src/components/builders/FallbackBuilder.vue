<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElRadioGroup, ElRadioButton, ElInput, ElButton, ElAutocomplete, ElTooltip } from 'element-plus'
import { Plus, Delete, Top, Bottom } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const configStore = useConfigStore()
const valueType = ref<'net' | 'gross'>('net')
const items = ref<string[]>([])
const defaultValue = ref('0')

// Invoicing items suggestions
const querySearch = (queryString: string, cb: (results: any[]) => void) => {
  const results = configStore.invoicingItems.map(item => ({
    value: item.name,
    description: item.description
  }))
  
  const filtered = queryString 
    ? results.filter(r => r.value.toLowerCase().includes(queryString.toLowerCase()))
    : results
    
  cb(filtered)
}

function parseExpression(expr: string) {
  if (!expr || !expr.trim()) return

  // Pattern: (Item1 ?: Item2 ?: Default)
  // Or Item1 ?: Item2 ?: Default
  
  let content = expr.trim()
  // Remove outer parens if present
  if (content.startsWith('(') && content.endsWith(')')) {
    content = content.substring(1, content.length - 1).trim()
  }

  // Check for net/gross
  if (content.includes('grossAmount')) {
    valueType.value = 'gross'
  } else {
    valueType.value = 'net'
  }

  // Split by ?:
  // Note: ?: is the operator.
  const parts = content.split('?:').map(p => p.trim())
  
  const foundItems: string[] = []
  
  // Process all parts except maybe the last one (default)
  // But we don't know which ones are items vs default.
  // Check if part matches invoicing item pattern
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const match = part.match(/#invoicingItems\['([^']+)'\]/)
    if (match) {
      foundItems.push(match[1])
    } else {
      // If it's the last part and doesn't look like an item, assume default
      if (i === parts.length - 1) {
        defaultValue.value = part
      }
    }
  }
  
  items.value = foundItems
}

function generateExpression() {
  if (items.value.length === 0) return defaultValue.value
  
  const typeField = valueType.value === 'gross' ? 'grossAmount' : 'netAmount'
  
  const parts = items.value.map(item => 
    `#invoicingItems['${item}']?.${typeField}?.value`
  )
  
  // Add default value
  parts.push(defaultValue.value)
  
  // Join with ?:
  const joined = parts.join(' ?: ')
  
  // Wrap in parens
  return `(${joined})`
}

// Watchers
watch([valueType, items, defaultValue], () => {
  emit('update:modelValue', generateExpression())
}, { deep: true })

onMounted(() => {
  parseExpression(props.modelValue)
})

// Actions
function addItem() {
  items.value.push('')
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function moveItem(index: number, direction: 'up' | 'down') {
  if (direction === 'up' && index > 0) {
    const temp = items.value[index]
    items.value[index] = items.value[index - 1]
    items.value[index - 1] = temp
  } else if (direction === 'down' && index < items.value.length - 1) {
    const temp = items.value[index]
    items.value[index] = items.value[index + 1]
    items.value[index + 1] = temp
  }
}
</script>

<template>
  <div class="fallback-builder p-4">
    <div class="mb-6">
      <div class="flex items-center mb-4">
        <span class="text-sm font-medium text-gray-700 mr-4">Value Type:</span>
        <ElRadioGroup v-model="valueType" size="small">
          <ElRadioButton label="net">Net Amount</ElRadioButton>
          <ElRadioButton label="gross">Gross Amount</ElRadioButton>
        </ElRadioGroup>
      </div>
    </div>

    <div class="priority-list mb-6">
      <div class="flex justify-between items-center mb-2">
        <label class="text-sm font-medium text-gray-700">Priority Chain (First available value used)</label>
        <ElButton size="small" :icon="Plus" @click="addItem">Add Source</ElButton>
      </div>
      
      <div class="space-y-2">
        <div 
          v-for="(_, index) in items" 
          :key="index"
          class="flex gap-2 items-center"
        >
          <div class="bg-gray-100 px-3 py-2 rounded text-gray-500 font-mono text-sm w-8 text-center">
            {{ index + 1 }}
          </div>
          
          <ElAutocomplete
            v-model="items[index]"
            :fetch-suggestions="querySearch"
            placeholder="Select Invoicing Item"
            class="flex-1"
            clearable
          >
            <template #default="{ item }">
              <div class="flex justify-between">
                <span>{{ item.value }}</span>
                <span class="text-gray-400 text-xs ml-2 truncate max-w-[200px]">{{ item.description }}</span>
              </div>
            </template>
          </ElAutocomplete>
          
          <div class="actions flex gap-1">
             <ElTooltip content="Move Up">
               <ElButton 
                 circle size="small" :icon="Top" 
                 :disabled="index === 0"
                 @click="moveItem(index, 'up')"
               />
             </ElTooltip>
             <ElTooltip content="Move Down">
               <ElButton 
                 circle size="small" :icon="Bottom" 
                 :disabled="index === items.length - 1"
                 @click="moveItem(index, 'down')"
               />
             </ElTooltip>
             <ElTooltip content="Remove">
               <ElButton 
                 circle size="small" type="danger" plain :icon="Delete" 
                 @click="removeItem(index)"
               />
             </ElTooltip>
          </div>
        </div>
        
        <div v-if="items.length === 0" class="p-4 text-center bg-gray-50 border border-dashed border-gray-300 rounded text-gray-500 text-sm">
          No items in chain. Add a source to start.
        </div>
      </div>
    </div>
    
    <div class="default-section pt-4 border-t">
      <label class="block text-sm font-medium text-gray-700 mb-1">Default / Fallback Value</label>
      <div class="flex items-center gap-2">
        <span class="text-gray-400 text-sm">Else:</span>
        <ElInput v-model="defaultValue" placeholder="0" class="w-40" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fallback-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
</style>

