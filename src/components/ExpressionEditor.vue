<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElInput, ElTag, ElButton, ElDialog } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import { validateSpelExpression } from '@/services/spel-validator'
import VisualExpressionBuilder from './builders/VisualExpressionBuilder.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const configStore = useConfigStore()
const localValue = ref(props.modelValue)
const validationResult = ref<any>(null)
const showBuilder = ref(false)
const builderValue = ref('')
const builderRef = ref<InstanceType<typeof VisualExpressionBuilder> | null>(null)

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
  validateExpression()
})

function handleInput(value: string) {
  localValue.value = value
  emit('update:modelValue', value)
  validateExpression()
}

function validateExpression() {
  if (!localValue.value || localValue.value.trim() === '') {
    validationResult.value = null
    return
  }
  
  validationResult.value = validateSpelExpression(
    localValue.value,
    configStore.invoicingItems,
    configStore.metadataVariables
  )
}

function openBuilder() {
  builderValue.value = localValue.value
  showBuilder.value = true
}

function applyBuilder() {
  if (builderRef.value) {
    const newVal = builderRef.value.getCurrentValue()
    handleInput(newVal)
    showBuilder.value = false
  }
}

const hasErrors = computed(() => 
  validationResult.value && validationResult.value.errors.length > 0
)

const hasWarnings = computed(() => 
  validationResult.value && validationResult.value.warnings.length > 0
)

// Initialize validation
validateExpression()
</script>

<template>
  <div class="expression-editor">
    <div class="editor-header flex justify-between items-center mb-2">
      <span class="text-xs font-medium text-gray-500">SpEL Expression</span>
      <ElButton type="primary" size="small" :icon="Edit" @click="openBuilder">
        Edit Condition
      </ElButton>
    </div>

    <ElInput
      :model-value="localValue"
      readonly
      type="textarea"
      :rows="rows || 3"
      :placeholder="placeholder || 'Click Edit Condition to configure...'"
      class="expression-input"
      :class="{
        'has-error': hasErrors,
        'has-warning': !hasErrors && hasWarnings
      }"
      @click="openBuilder"
    />
    
    <div v-if="validationResult" class="validation-info mt-2">
      <div v-if="validationResult.errors.length > 0" class="errors mb-2">
        <ElTag
          v-for="(error, index) in validationResult.errors"
          :key="`error-${index}`"
          type="danger"
          size="small"
          class="mr-1 mb-1"
        >
          {{ error }}
        </ElTag>
      </div>
      
      <div v-if="validationResult.warnings.length > 0" class="warnings mb-2">
        <ElTag
          v-for="(warning, index) in validationResult.warnings"
          :key="`warning-${index}`"
          type="warning"
          size="small"
          class="mr-1 mb-1"
        >
          {{ warning }}
        </ElTag>
      </div>
      
      <div v-if="validationResult.variables.length > 0" class="variables">
        <span class="text-xs text-gray-600 mr-2">Variables:</span>
        <ElTag
          v-for="(variable, index) in validationResult.variables"
          :key="`var-${index}`"
          type="info"
          size="small"
          class="mr-1 mb-1"
        >
          {{ variable }}
        </ElTag>
      </div>
    </div>

    <ElDialog
      v-model="showBuilder"
      title="Edit Condition"
      width="900px"
      align-center
      destroy-on-close
      :close-on-click-modal="false"
    >
      <VisualExpressionBuilder
        ref="builderRef"
        :model-value="builderValue"
      />
      <template #footer>
        <span class="dialog-footer">
          <ElButton @click="showBuilder = false">Cancel</ElButton>
          <ElButton type="primary" @click="applyBuilder">Apply</ElButton>
        </span>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.expression-editor {
  width: 100%;
}

.expression-input :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  cursor: pointer;
  background-color: #fafafa;
}

.expression-input :deep(.el-textarea__inner):hover {
  background-color: #f0f0f0;
}

.expression-input.has-error :deep(.el-textarea__inner) {
  border-color: var(--color-error);
}

.expression-input.has-warning :deep(.el-textarea__inner) {
  border-color: var(--color-warning);
}

.validation-info {
  font-size: 0.75rem;
}

.errors, .warnings, .variables {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
