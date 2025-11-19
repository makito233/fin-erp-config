<script setup lang="ts">
import { ElButton, ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import { serializeConfigToYaml } from '@/services/yaml-parser'

const configStore = useConfigStore()

function downloadConfig() {
  if (!configStore.config) {
    ElMessage.warning('No configuration loaded')
    return
  }

  try {
    const yamlContent = serializeConfigToYaml(configStore.config)
    
    // Create blob and download
    const blob = new Blob([yamlContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = configStore.fileName || 'sap-config.yml'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('Configuration downloaded successfully')
  } catch (error) {
    ElMessage.error(`Failed to download configuration: ${error}`)
  }
}
</script>

<template>
  <ElButton
    type="success"
    @click="downloadConfig"
    :disabled="!configStore.isConfigLoaded"
    :icon="Download"
  >
    Download YAML
  </ElButton>
</template>

