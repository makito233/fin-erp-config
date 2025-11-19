<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { ElRadioGroup, ElRadioButton, ElCheckbox, ElInput, ElScrollbar } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const configStore = useConfigStore()
const valueType = ref<'net' | 'gross'>('net')
const searchQuery = ref('')

const addedItems = ref<Set<string>>(new Set())
const subtractedItems = ref<Set<string>>(new Set())

// Invoicing items from store
const invoicingItems = computed(() => configStore.invoicingItems)
const filteredItems = computed(() => {
  if (!searchQuery.value) return invoicingItems.value
  const q = searchQuery.value.toLowerCase()
  return invoicingItems.value.filter(item => 
    item.name.toLowerCase().includes(q) || 
    item.description.toLowerCase().includes(q)
  )
})

// Parse initial expression
function parseExpression(expr: string) {
  if (!expr) return

  // Check if net or gross
  if (expr.includes('grossAmount')) {
    valueType.value = 'gross'
  } else {
    valueType.value = 'net' // Default
  }

  const normalized = expr.replace(/\s+/g, ' ')
  const newAdded = new Set<string>()
  const newSubtracted = new Set<string>()
  
  // Find all item occurrences
  const itemRegex = /#invoicingItems\['([^']+)'\]/g
  let match
  
  while ((match = itemRegex.exec(normalized)) !== null) {
    const itemName = match[1]
    const index = match.index
    
    // Look backwards for the sign
    const prefix = normalized.substring(0, index)
    
    // Find last occurrence of + or -
    // We ignore signs that are too far away or inside other structures if possible,
    // but for simple sums, the last sign is usually the operator.
    const lastPlus = prefix.lastIndexOf('+')
    const lastMinus = prefix.lastIndexOf('-')
    
    let isSubtract = false
    
    if (lastMinus > lastPlus) {
      // We found a minus closer than a plus
      isSubtract = true
    }
    
    // However, we must ensure this sign actually belongs to this term.
    // e.g. "Expression + ..." -> First term has no sign.
    // If signIndex is -1, it's positive.
    
    if (isSubtract) {
      newSubtracted.add(itemName)
    } else {
      newAdded.add(itemName)
    }
  }
  
  addedItems.value = newAdded
  subtractedItems.value = newSubtracted
}

// Generate expression
function generateExpression() {
  const typeField = valueType.value === 'gross' ? 'grossAmount' : 'netAmount'
  
  // Convert sets to arrays for processing
  const added = Array.from(addedItems.value)
  const subtracted = Array.from(subtractedItems.value)
  
  if (added.length === 0 && subtracted.length === 0) {
    return '0'
  }
  
  const allParts: string[] = []
  
  added.forEach(item => {
    allParts.push(`+ (#invoicingItems['${item}']?.${typeField}?.value ?: 0)`)
  })
  
  subtracted.forEach(item => {
    allParts.push(`- (#invoicingItems['${item}']?.${typeField}?.value ?: 0)`)
  })
  
  // Join them
  let result = allParts.join('\n  ')
  
  // Clean up leading '+'
  if (result.startsWith('+ ')) {
    result = result.substring(2)
  }
  
  // Wrap in parens if complex
  if (allParts.length > 1) {
    result = `(\n  ${result}\n)`
  }
  
  return result
}

// Watch for changes in internal state to update modelValue
watch([valueType, addedItems, subtractedItems], () => {
  const newExpr = generateExpression()
  emit('update:modelValue', newExpr)
}, { deep: true })

// Watch for changes in modelValue (e.g. from Advanced tab) to update internal state
watch(() => props.modelValue, (newVal) => {
  const currentGen = generateExpression()
  // Only re-parse if the value is different from what we currently generate
  // This prevents loops and preserves state if identical
  if (newVal !== currentGen) {
    parseExpression(newVal)
  }
})

// Initial parse
onMounted(() => {
  parseExpression(props.modelValue)
})

function toggleItem(item: string, mode: 'add' | 'subtract') {
  if (mode === 'add') {
    if (addedItems.value.has(item)) {
      addedItems.value.delete(item)
    } else {
      addedItems.value.add(item)
      subtractedItems.value.delete(item) // Can't be both
    }
  } else {
    if (subtractedItems.value.has(item)) {
      subtractedItems.value.delete(item)
    } else {
      subtractedItems.value.add(item)
      addedItems.value.delete(item)
    }
  }
}

function isSelected(item: string) {
  return addedItems.value.has(item) || subtractedItems.value.has(item)
}
</script>

<template>
  <div class="sum-builder">
    <div class="controls">
      <div class="type-selector mb-4 flex items-center">
        <span class="label mr-4 font-medium text-sm text-gray-700">Value Type:</span>
        <ElRadioGroup v-model="valueType" size="small">
          <ElRadioButton label="net">Net Amount</ElRadioButton>
          <ElRadioButton label="gross">Gross Amount</ElRadioButton>
        </ElRadioGroup>
      </div>
      
      <ElInput
        v-model="searchQuery"
        placeholder="Search invoicing items..."
        :prefix-icon="Search"
        clearable
        class="mb-4"
      />
    </div>

    <div class="items-container">
      <div class="headers grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b font-medium text-sm text-gray-600">
        <div class="col-span-8">Item Name</div>
        <div class="col-span-2 text-center">Add (+)</div>
        <div class="col-span-2 text-center">Subtract (-)</div>
      </div>
      
      <ElScrollbar height="400px">
        <div v-if="filteredItems.length === 0" class="p-4 text-center text-gray-500">
          No items found.
        </div>
        <div 
          v-for="item in filteredItems" 
          :key="item.name"
          class="item-row grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-gray-50 items-center transition-colors"
          :class="{ 'bg-blue-50': isSelected(item.name) }"
        >
          <div class="col-span-8">
            <div class="font-medium text-sm text-gray-900">{{ item.name }}</div>
            <div class="text-xs text-gray-500 truncate" :title="item.description">{{ item.description }}</div>
          </div>
          <div class="col-span-2 text-center">
            <ElCheckbox 
              :model-value="addedItems.has(item.name)"
              @change="toggleItem(item.name, 'add')"
            />
          </div>
          <div class="col-span-2 text-center">
            <ElCheckbox 
              :model-value="subtractedItems.has(item.name)"
              @change="toggleItem(item.name, 'subtract')"
            />
          </div>
        </div>
      </ElScrollbar>
    </div>
  </div>
</template>

<style scoped>
.sum-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.items-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.item-row:last-child {
  border-bottom: none;
}
</style>

