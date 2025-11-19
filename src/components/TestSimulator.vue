<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElButton, ElSelect, ElOption, ElAlert, ElCard, ElMessage, ElTabs, ElTabPane } from 'element-plus'
import { useConfigStore } from '@/stores/config-store'
import { generateSapPayload } from '@/services/payload-generator'
import FetchOrderDialog from './FetchOrderDialog.vue'
import InvoicingItemsEditor from './InvoicingItemsEditor.vue'
import OrderMetadataEditor from './OrderMetadataEditor.vue'
import PaymentsEditor from './PaymentsEditor.vue'
import type { TestOrderData } from '@/types/order-data'

const configStore = useConfigStore()

const selectedCountry = ref('ES')
const supportedCountries = ref<{ code: string; status: string }[]>([])
const availableCountries = computed(() => supportedCountries.value.map(country => country.code))
const generatedPayload = ref<any>(null)
const generationErrors = ref<Array<{ field: string; error: string }>>([])
const isGenerating = ref(false)
const testData = ref<TestOrderData | null>(null)
const showFetchDialog = ref(false)
const activeInputTab = ref('visual')
const activeVisualTab = ref('items')

onMounted(async () => {
  try {
    const [sampleRes, countriesRes] = await Promise.all([
      fetch('/data/sample-order.json'),
      fetch('/data/supported-countries.json')
    ])

    const [sampleData, countriesData] = await Promise.all([
      sampleRes.json(),
      countriesRes.json()
    ])

    supportedCountries.value = Array.isArray(countriesData) ? countriesData : []

    const normalized = configStore.loadTestData(sampleData as TestOrderData)
    testData.value = normalized

    if (availableCountries.value.length > 0) {
      selectedCountry.value = availableCountries.value[0]
    }
  } catch (error) {
    supportedCountries.value = []
    ElMessage.error('Failed to load sample data')
  }
})

function generatePayload() {
  if (!configStore.config || !testData.value) {
    ElMessage.warning('Please load a configuration and test data first')
    return
  }

  isGenerating.value = true
  generationErrors.value = []

  try {
    const result = generateSapPayload(
      configStore.config,
      testData.value,
      selectedCountry.value
    )

    generatedPayload.value = result.payload
    generationErrors.value = result.errors

    if (result.success) {
      ElMessage.success('Payload generated successfully')
    } else {
      ElMessage.warning(`Payload generated with ${result.errors.length} errors`)
    }
  } catch (error) {
    ElMessage.error(`Failed to generate payload: ${error}`)
  } finally {
    isGenerating.value = false
  }
}

function copyPayload() {
  if (!generatedPayload.value) return
  
  const text = JSON.stringify(generatedPayload.value, null, 2)
  navigator.clipboard.writeText(text)
  ElMessage.success('Payload copied to clipboard')
}

function handleFetchSuccess(data: TestOrderData) {
  const normalized = configStore.loadTestData(data)
  testData.value = normalized
  if (normalized.financialSourceCountryCodeValue) {
    selectedCountry.value = normalized.financialSourceCountryCodeValue
  }
}

function handleDataChange() {
  // When data changes in the editor, update the store
  if (testData.value) {
    configStore.loadTestData(testData.value)
  }
}
</script>

<template>
  <div class="test-simulator">
    <div class="section-header">
      <h2 class="text-xl font-semibold text-gray-900">Test Simulator</h2>
      <p class="text-sm text-gray-600 mt-1">
        Test your configuration with sample order data
      </p>
    </div>

    <div class="controls mb-4 flex-shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Country:</label>
          <ElSelect
            v-model="selectedCountry"
            placeholder="Select country"
            style="width: 160px"
            :disabled="availableCountries.length === 0"
          >
            <ElOption
              v-for="country in availableCountries"
              :key="country"
              :label="country"
              :value="country"
            />
          </ElSelect>
        </div>

        <ElButton @click="showFetchDialog = true">
          Load FT Data
        </ElButton>

        <ElButton
          type="primary"
          @click="generatePayload"
          :loading="isGenerating"
          :disabled="!configStore.isConfigLoaded"
        >
          Generate Payload
        </ElButton>

        <ElButton
          v-if="generatedPayload"
          @click="copyPayload"
        >
          Copy to Clipboard
        </ElButton>
      </div>
    </div>

    <div v-if="generationErrors.length > 0" class="errors-section mb-4 flex-shrink-0">
      <ElAlert
        title="Generation Errors"
        type="error"
        :closable="false"
        show-icon
      >
        <div class="error-list">
          <div
            v-for="(error, index) in generationErrors"
            :key="index"
            class="error-item text-sm"
          >
            <strong>{{ error.field }}:</strong> {{ error.error }}
          </div>
        </div>
      </ElAlert>
    </div>

    <div class="results flex-1 overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div class="input-section h-full flex flex-col">
          <ElTabs v-model="activeInputTab" type="border-card" class="h-full flex flex-col">
            <ElTabPane label="Visual Editor" name="visual" class="h-full">
              <div class="h-full flex flex-col">
                <ElTabs v-model="activeVisualTab" class="visual-tabs flex-1 flex flex-col">
                  <ElTabPane label="Invoicing Items" name="items" class="h-full">
                    <InvoicingItemsEditor 
                      v-model="testData" 
                      @change="handleDataChange"
                      class="h-full"
                    />
                  </ElTabPane>
                  <ElTabPane label="Order Metadata" name="metadata" class="h-full">
                    <OrderMetadataEditor
                      v-model="testData"
                      @change="handleDataChange"
                      class="h-full"
                    />
                  </ElTabPane>
                  <ElTabPane label="Payments" name="payments" class="h-full">
                    <PaymentsEditor
                      v-model="testData"
                      @change="handleDataChange"
                      class="h-full"
                    />
                  </ElTabPane>
                </ElTabs>
            </div>
            </ElTabPane>
            <ElTabPane label="JSON View" name="json" class="h-full">
              <div class="json-display h-full overflow-auto p-4 bg-gray-900 text-gray-100">
            <pre><code>{{ JSON.stringify(testData, null, 2) }}</code></pre>
          </div>
            </ElTabPane>
          </ElTabs>
        </div>

        <ElCard class="output-card h-full flex flex-col" :body-style="{ flex: 1, overflow: 'hidden', display: 'flex', padding: 0 }">
          <template #header>
            <div class="card-header">
              <span class="text-base font-semibold">Generated SAP Payload</span>
            </div>
          </template>
          <div v-if="generatedPayload" class="json-display h-full overflow-auto p-4">
            <pre><code>{{ JSON.stringify(generatedPayload, null, 2) }}</code></pre>
          </div>
          <div v-else class="empty-output h-full flex items-center justify-center">
            <p class="text-gray-500 text-center">
              Click "Generate Payload" to see results
            </p>
          </div>
        </ElCard>
      </div>
    </div>

    <FetchOrderDialog
      v-model="showFetchDialog"
      @success="handleFetchSuccess"
    />
  </div>
</template>

<style scoped>
.test-simulator {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.controls {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.errors-section {
  max-height: 200px;
  overflow-y: auto;
}

.error-list {
  margin-top: 0.5rem;
}

.error-item {
  margin-bottom: 0.25rem;
  color: #dc2626;
}

.results {
  margin-top: 1.5rem;
}

.input-section,
.output-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Fix for Tabs height */
:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0 !important;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

.visual-tabs {
  display: flex;
  flex-direction: column;
}

/* Special handling for nested tabs */
.visual-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  background-color: #f5f7fa;
  padding: 0 1rem;
}

.visual-tabs :deep(.el-tabs__content) {
  background-color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-display {
  flex: 1;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.json-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-display code {
  color: #d4d4d4;
}

.empty-output {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 4px;
  padding: 2rem;
}

@media (max-width: 1024px) {
  .input-section,
  .output-card {
    height: 400px;
  }
}
</style>
