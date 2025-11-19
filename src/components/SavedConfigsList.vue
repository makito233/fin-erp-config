<script setup lang="ts">
import { computed } from 'vue'
import { ElTable, ElTableColumn, ElButton, ElPopconfirm, ElEmpty } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import { parseYamlToConfig } from '@/services/yaml-parser'
import { validateConfig } from '@/services/validator'

const emit = defineEmits<{
  (e: 'load-success'): void
}>()

const configStore = useConfigStore()

const savedFiles = computed(() => configStore.savedFiles)

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString()
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
    
    emit('load-success')
  } catch (error) {
    console.error('Failed to load saved file', error)
  }
}

function deleteFile(id: string) {
  configStore.deleteFromHistory(id)
}
</script>

<template>
  <div class="saved-configs-list">
    <div v-if="savedFiles.length === 0" class="empty-state">
      <ElEmpty description="No saved configurations found" />
    </div>

    <ElTable v-else :data="savedFiles" style="width: 100%" height="300">
      <ElTableColumn prop="name" label="File Name" width="180" />
      <ElTableColumn prop="date" label="Date" width="180">
        <template #default="{ row }">
          {{ formatDate(row.date) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="Actions" fixed="right" width="120">
        <template #default="{ row }">
          <div class="actions">
            <ElButton
              link
              type="primary"
              size="small"
              @click="loadFile(row.id)"
            >
              Load
            </ElButton>
            <ElPopconfirm
              title="Are you sure to delete this?"
              @confirm="deleteFile(row.id)"
            >
              <template #reference>
                <ElButton
                  link
                  type="danger"
                  size="small"
                  :icon="Delete"
                />
              </template>
            </ElPopconfirm>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style scoped>
.saved-configs-list {
  width: 100%;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>

