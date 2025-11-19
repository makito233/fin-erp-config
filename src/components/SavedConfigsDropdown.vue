<script setup lang="ts">
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElButton, ElIcon, ElPopconfirm, ElMessage } from 'element-plus'
import { FolderOpened, Delete, Document } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import { parseYamlToConfig } from '@/services/yaml-parser'
import { validateConfig } from '@/services/validator'

const configStore = useConfigStore()
const savedFiles = computed(() => configStore.savedFiles)

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString()
}

function loadFile(id: string) {
  const file = configStore.loadFromHistory(id)
  if (!file) return

  try {
    const config = parseYamlToConfig(file.content)
    configStore.loadConfig(config, file.name)
    
    const errors = validateConfig(
      config,
      configStore.invoicingItems,
      configStore.metadataVariables
    )
    configStore.setValidationErrors(errors)
    
    ElMessage.success(`Loaded ${file.name}`)
  } catch (error) {
    console.error('Failed to load saved file', error)
    ElMessage.error('Failed to load saved file')
  }
}

function deleteFile(id: string) {
  configStore.deleteFromHistory(id)
}

function clearAll() {
  configStore.clearHistory()
  ElMessage.success('History cleared')
}
</script>

<template>
  <ElDropdown trigger="click" :disabled="savedFiles.length === 0">
    <ElButton type="info" plain :icon="FolderOpened">
      Saved Files
      <span v-if="savedFiles.length > 0" class="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
        {{ savedFiles.length }}
      </span>
    </ElButton>
    
    <template #dropdown>
      <ElDropdownMenu class="saved-files-menu">
        <div v-if="savedFiles.length === 0" class="p-4 text-center text-gray-500 text-sm">
          No saved files
        </div>
        
        <template v-else>
          <div class="files-list">
            <div v-for="file in savedFiles" :key="file.id" class="saved-file-item">
              <div class="file-info" @click="loadFile(file.id)">
                <ElIcon class="mr-2 text-gray-400"><Document /></ElIcon>
                <div class="file-details">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-date">{{ formatDate(file.date) }}</div>
                </div>
              </div>
              
              <ElPopconfirm
                title="Delete this file?"
                width="200"
                @confirm="deleteFile(file.id)"
              >
                <template #reference>
                  <div class="delete-btn">
                    <ElIcon><Delete /></ElIcon>
                  </div>
                </template>
              </ElPopconfirm>
            </div>
          </div>

          <div class="dropdown-footer">
            <ElPopconfirm
              title="Clear all saved files?"
              width="200"
              @confirm="clearAll"
            >
              <template #reference>
                <ElButton type="danger" link size="small" class="clear-all-btn">
                  Clear All History
                </ElButton>
              </template>
            </ElPopconfirm>
          </div>
        </template>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.saved-files-menu {
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.files-list {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-footer {
  padding: 8px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  background-color: #f9fafb;
}

.clear-all-btn {
  width: 100%;
}

.saved-file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.saved-file-item:last-child {
  border-bottom: none;
}

.saved-file-item:hover {
  background-color: #f5f7fa;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
}

.file-details {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  font-size: 12px;
  color: #909399;
}

.delete-btn {
  padding: 6px;
  color: #f56c6c;
  cursor: pointer;
  border-radius: 4px;
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.delete-btn:hover {
  background-color: #fef0f0;
}
</style>

