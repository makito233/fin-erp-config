<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElTabs, ElTabPane, ElInput, ElButton, ElCard, ElIcon } from 'element-plus'
import { Connection, Operation, Back, Sort } from '@element-plus/icons-vue'
import SumBuilder from './SumBuilder.vue'
import SwitchBuilder from './SwitchBuilder.vue'
import FallbackBuilder from './FallbackBuilder.vue'

const props = defineProps<{
  modelValue: string
}>()

const activeTab = ref('visual')
const step = ref<'selection' | 'builder'>('selection')
const mode = ref<'direct' | 'conditional' | 'fallback'>('direct')
const currentValue = ref(props.modelValue)

// Update internal value when prop changes
watch(() => props.modelValue, (val) => {
  currentValue.value = val
})

// Detect type on mount
onMounted(() => {
  detectTypeAndInit()
})

function detectTypeAndInit() {
  if (!props.modelValue || !props.modelValue.trim()) {
    step.value = 'selection'
    return
  }
  
  const val = props.modelValue.trim()
  
  // Check for Map pattern: { ... }[ ... ]
  if (val.includes('}[') && val.includes('{')) {
    mode.value = 'conditional'
    step.value = 'builder'
    return
  }
  
  // Check for Fallback pattern: uses ?: chain without + or -
  // Or simply contains ?: and #invoicingItems but NOT {
  if (val.includes('#invoicingItems') && val.includes('?:') && !val.includes('{') && !val.includes('+') && !val.includes('-')) {
    mode.value = 'fallback'
    step.value = 'builder'
    return
  }
  
  // Check for Sum pattern: #invoicingItems
  if (val.includes('#invoicingItems') && !val.includes('{')) {
    mode.value = 'direct'
    step.value = 'builder'
    return
  }
  
  // Default fallback to Advanced if existing content is unrecognized
  activeTab.value = 'advanced'
}

function selectMode(selectedMode: 'direct' | 'conditional' | 'fallback') {
  mode.value = selectedMode
  step.value = 'builder'
  
  // If switching modes on empty content, generate a default template
  if (!currentValue.value) {
    if (selectedMode === 'direct') {
      currentValue.value = '0'
    } else if (selectedMode === 'conditional') {
      currentValue.value = "{}[#input.orderMetadata?.handlingStrategy] ?: 0"
    } else if (selectedMode === 'fallback') {
      currentValue.value = "0"
    }
  }
}

function handleUpdate(val: string) {
  currentValue.value = val
}

defineExpose({
  getCurrentValue: () => currentValue.value
})
</script>

<template>
  <div class="visual-builder">
    <ElTabs v-model="activeTab" type="card">
      <ElTabPane label="Visual Builder" name="visual">
        
        <!-- Step 1: Selection -->
        <div v-if="step === 'selection'" class="selection-step h-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
           <div class="grid grid-cols-3 gap-6 max-w-5xl w-full p-8">
             <ElCard class="cursor-pointer hover:shadow-lg transition-shadow text-center p-6" @click="selectMode('direct')">
               <div class="flex justify-center mb-4">
                 <ElIcon :size="48" class="text-blue-500"><Connection /></ElIcon>
               </div>
               <h3 class="text-lg font-semibold mb-2 text-gray-800">Direct Mapping</h3>
               <p class="text-sm text-gray-500">Map directly to an arithmetic operation on invoicing items (Sum).</p>
             </ElCard>
             
             <ElCard class="cursor-pointer hover:shadow-lg transition-shadow text-center p-6" @click="selectMode('conditional')">
               <div class="flex justify-center mb-4">
                 <ElIcon :size="48" class="text-purple-500"><Operation /></ElIcon>
               </div>
               <h3 class="text-lg font-semibold mb-2 text-gray-800">Conditional Mapping</h3>
               <p class="text-sm text-gray-500">Map to different values based on a specific variable or strategy.</p>
             </ElCard>

             <ElCard class="cursor-pointer hover:shadow-lg transition-shadow text-center p-6" @click="selectMode('fallback')">
               <div class="flex justify-center mb-4">
                 <ElIcon :size="48" class="text-orange-500"><Sort /></ElIcon>
               </div>
               <h3 class="text-lg font-semibold mb-2 text-gray-800">Fallback Mapping</h3>
               <p class="text-sm text-gray-500">Use the first available value from a priority list of items.</p>
             </ElCard>
           </div>
        </div>
        
        <!-- Step 2: Builder -->
        <div v-else class="builder-step h-full flex flex-col">
          <div class="step-header flex items-center mb-4 pb-2 border-b">
            <ElButton link :icon="Back" @click="step = 'selection'">Back</ElButton>
            <span class="mx-2 text-gray-300">|</span>
            <span class="font-medium text-gray-700">
              {{ mode === 'direct' ? 'Direct Mapping Builder' : (mode === 'conditional' ? 'Conditional Mapping Builder' : 'Fallback Chain Builder') }}
            </span>
          </div>
          
          <div class="builder-content flex-1 overflow-hidden">
            <SumBuilder 
              v-if="mode === 'direct'"
              :model-value="currentValue"
              @update:model-value="handleUpdate"
            />
            <SwitchBuilder
              v-else-if="mode === 'conditional'"
              :model-value="currentValue"
              @update:model-value="handleUpdate"
            />
            <FallbackBuilder
              v-else
              :model-value="currentValue"
              @update:model-value="handleUpdate"
            />
          </div>
        </div>

      </ElTabPane>
      
      <ElTabPane label="Advanced Code" name="advanced">
        <div class="code-editor-container">
          <ElInput
            v-model="currentValue"
            type="textarea"
            :rows="15"
            resize="none"
            class="font-mono"
            placeholder="Enter SpEL expression..."
          />
        </div>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.visual-builder {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.selection-step {
  min-height: 450px;
}

.builder-step {
  min-height: 450px;
}

.builder-content {
  height: 450px;
}

.code-editor-container {
  height: 100%;
}

:deep(.el-textarea__inner) {
  font-family: monospace;
}
</style>
