<script setup lang="ts">
import { ref } from 'vue'
import { ElIcon, ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import { parseYamlToConfig, validateYamlStructure } from '@/services/yaml-parser'
import { validateConfig } from '@/services/validator'

const configStore = useConfigStore()
const isDragging = ref(false)

const emit = defineEmits<{
  (e: 'upload-success'): void
}>()

async function handleFileUpload(file: File) {
  configStore.setLoading(true)
  
  try {
    const content = await file.text()
    
    // Validate YAML structure
    const validation = validateYamlStructure(content)
    if (!validation.valid) {
      ElMessage.error(`Invalid YAML: ${validation.error}`)
      configStore.setLoading(false)
      return
    }
    
    // Parse YAML to config
    const config = parseYamlToConfig(content)
    
    // Load config into store
    configStore.loadConfig(config, file.name)
    
    // Save to local storage history
    configStore.saveToHistory(config, file.name, content)
    
    // Validate config
    const errors = validateConfig(
      config,
      configStore.invoicingItems,
      configStore.metadataVariables
    )
    configStore.setValidationErrors(errors)
    
    ElMessage.success(`Loaded ${file.name} successfully`)
    emit('upload-success')
  } catch (error) {
    ElMessage.error(`Failed to load file: ${error}`)
  } finally {
    configStore.setLoading(false)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileUpload(files[0])
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFileUpload(files[0])
  }
}

function handleDragOver(event: DragEvent) {
  isDragging.value = true
  event.preventDefault()
}

function handleDragLeave() {
  isDragging.value = false
}
</script>

<template>
  <div class="file-uploader">
    <div
      class="upload-area"
      :class="{ dragging: isDragging }"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <input
        type="file"
        accept=".yml,.yaml"
        class="hidden"
        id="file-input"
        @change="handleFileChange"
      />
      <label for="file-input" class="upload-label">
        <div class="upload-icon">
          <ElIcon :size="48" color="var(--color-primary)">
            <Upload />
          </ElIcon>
        </div>
        <div class="upload-text">
          <p class="text-lg font-medium text-gray-700">
            Drop your YAML file here or click to browse
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Accepts .yml and .yaml files
          </p>
        </div>
      </label>
    </div>
    
    <div v-if="configStore.fileName" class="mt-4 text-sm text-gray-600">
      Current file: <span class="font-medium">{{ configStore.fileName }}</span>
    </div>
  </div>
</template>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #fafafa;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background-color: #f0f9ff;
}

.upload-area.dragging {
  border-color: var(--color-primary);
  background-color: #e0f2fe;
  transform: scale(1.02);
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-icon {
  margin-bottom: 1rem;
}

.hidden {
  display: none;
}
</style>

