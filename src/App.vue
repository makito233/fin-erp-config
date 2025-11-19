<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElContainer, ElHeader, ElMain, ElAside, ElTabs, ElTabPane, ElIcon, ElButton, ElDialog, ElPopconfirm, ElMessage } from 'element-plus'
import { Menu, Document, DataAnalysis, Collection, Upload, Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import FileUploader from '@/components/FileUploader.vue'
import FieldMappingSection from '@/components/FieldMappingSection.vue'
import ConditionMappingSection from '@/components/ConditionMappingSection.vue'
import TestSimulator from '@/components/TestSimulator.vue'
import ReferenceSection from '@/components/ReferenceSection.vue'
import ValidationPanel from '@/components/ValidationPanel.vue'
import DownloadButton from '@/components/DownloadButton.vue'
import SavedConfigsDropdown from '@/components/SavedConfigsDropdown.vue'
import { validateConfig } from '@/services/validator'
import RfcGenerator from '@/components/RfcGenerator.vue'
import type { SupportedCountry } from '@/types'

const configStore = useConfigStore()
const activeTab = ref('fields')
const showValidationPanel = ref(true)
const showUploadDialog = ref(false)
const supportedCountries = ref<SupportedCountry[]>([])
const rfcSelectedCountry = ref('')
const supportedCountryCodes = computed(() => supportedCountries.value.map(country => country.code))

onMounted(async () => {
  // Load invoicing items, metadata and supported countries
  try {
    const [invoicingItemsRes, metadataRes, countriesRes] = await Promise.all([
      fetch('/data/invoicing-items.json'),
      fetch('/data/metadata-variables.json'),
      fetch('/data/supported-countries.json')
    ])
    
    const [invoicingItems, metadataVariables, countries] = await Promise.all([
      invoicingItemsRes.json(),
      metadataRes.json(),
      countriesRes.json()
    ])
    
    configStore.loadInvoicingItems(invoicingItems)
    configStore.loadMetadataVariables(metadataVariables)
    supportedCountries.value = Array.isArray(countries) ? countries : []
    if (supportedCountryCodes.value.length > 0) {
      rfcSelectedCountry.value = supportedCountryCodes.value[0]
    }

    if (configStore.config) {
      const errors = validateConfig(configStore.config, invoicingItems, metadataVariables)
      configStore.setValidationErrors(errors)
    }
  } catch (error) {
    console.error('Failed to load reference data:', error)
    supportedCountries.value = []
  }
})

function handleUploadSuccess() {
  showUploadDialog.value = false
  if (activeTab.value === 'fields' && !configStore.config) {
    // If we were on fields tab (default) but had no config, we still are there.
    // The content will update automatically.
  }
}

function clearAllData() {
  configStore.clearConfig()
  configStore.clearTestData()
  ElMessage.success('All data cleared')
}
</script>

<template>
  <div id="app">
    <ElContainer class="app-container">
      <ElHeader class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <ElIcon :size="32" color="var(--color-primary)">
              <Menu />
            </ElIcon>
            <h1 class="title">SAP Config Editor</h1>
          </div>
          <div class="actions">
            <SavedConfigsDropdown />
            <ElPopconfirm
              title="Clear all loaded data?"
              width="220"
              @confirm="clearAllData"
              v-if="configStore.isConfigLoaded"
            >
              <template #reference>
                <ElButton type="danger" plain :icon="Delete">
                  Clear Data
                </ElButton>
              </template>
            </ElPopconfirm>
            <ElButton
              type="primary"
              :icon="Upload"
              @click="showUploadDialog = true"
            >
              Upload YAML
            </ElButton>
            <DownloadButton />
          </div>
        </div>
      </ElHeader>

      <ElContainer class="main-container">
        <ElMain class="content-main">
          <ElTabs v-model="activeTab" type="border-card" class="content-tabs">
            <ElTabPane name="fields">
              <template #label>
                <span class="tab-label">
                  <ElIcon><Document /></ElIcon>
                  <span>Field Mappings</span>
                </span>
              </template>
              <div class="tab-content">
                <FieldMappingSection />
              </div>
            </ElTabPane>

            <ElTabPane name="conditions">
              <template #label>
                <span class="tab-label">
                  <ElIcon><Menu /></ElIcon>
                  <span>Condition Mappings</span>
                </span>
              </template>
              <div class="tab-content">
                <ConditionMappingSection />
              </div>
            </ElTabPane>

            <ElTabPane name="test">
              <template #label>
                <span class="tab-label">
                  <ElIcon><DataAnalysis /></ElIcon>
                  <span>Test</span>
                </span>
              </template>
              <div class="tab-content">
                <TestSimulator />
              </div>
            </ElTabPane>

            <ElTabPane name="rfc">
              <template #label>
                <span class="tab-label">
                  <ElIcon><Document /></ElIcon>
                  <span>RFC Generator</span>
                </span>
              </template>
              <div class="tab-content">
                <RfcGenerator
                  :config="configStore.config"
                  :metadata-variables="configStore.metadataVariables"
                  :supported-countries="supportedCountryCodes"
                  :selected-country="rfcSelectedCountry"
                  @update:selected-country="(value: string) => (rfcSelectedCountry = value)"
                />
              </div>
            </ElTabPane>

            <ElTabPane name="reference">
              <template #label>
                <span class="tab-label">
                  <ElIcon><Collection /></ElIcon>
                  <span>Reference</span>
                </span>
              </template>
              <div class="tab-content">
                <ReferenceSection />
              </div>
            </ElTabPane>
          </ElTabs>
        </ElMain>

        <ElAside
          v-if="showValidationPanel"
          width="350px"
          class="validation-aside"
        >
          <ValidationPanel />
        </ElAside>
      </ElContainer>

      <!-- Upload Dialog -->
      <ElDialog
        v-model="showUploadDialog"
        title="Upload Configuration"
        width="500px"
        align-center
      >
        <FileUploader @upload-success="handleUploadSuccess" />
      </ElDialog>
    </ElContainer>
  </div>
</template>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  height: 70px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.content-main {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.validation-aside {
  background-color: white;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}

.upload-success {
  max-width: 600px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 1rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .validation-aside {
    display: none;
  }
}
</style>
