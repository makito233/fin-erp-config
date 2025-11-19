<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElTabs, ElTabPane, ElTable, ElTableColumn, ElInput, ElTag, ElCard, ElIcon } from 'element-plus'
import { Search, InfoFilled } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'

const configStore = useConfigStore()
const activeTab = ref('invoicing')
const searchQuery = ref('')

const filteredInvoicingItems = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return configStore.invoicingItems.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.description.toLowerCase().includes(query) ||
    item.sourceType.toLowerCase().includes(query)
  )
})

const filteredMetadataVariables = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return configStore.metadataVariables.filter(variable => 
    variable.name.toLowerCase().includes(query) || 
    variable.description.toLowerCase().includes(query) ||
    variable.type.toLowerCase().includes(query)
  )
})

function getTypeColor(type: string): 'success' | 'info' | 'warning' | 'danger' | 'primary' | undefined {
  switch (type.toLowerCase()) {
    case 'order': return 'primary'
    case 'prime_subscription': return 'success'
    case 'partner_fees': return 'warning'
    case 'ads_report': return 'info'
    case 'payout': return 'danger'
    case 'courier_account_entry': return 'warning'
    case 'manual_import': return 'info'
    default: return undefined
  }
}
</script>

<template>
  <div class="reference-section">
    <div class="section-header">
      <h2 class="text-xl font-semibold text-gray-900">Reference Guide</h2>
      <p class="text-sm text-gray-600 mt-1">
        Available items and variables for SpEL expressions
      </p>
    </div>

    <div class="search-bar mb-4">
      <ElInput
        v-model="searchQuery"
        placeholder="Search items..."
        :prefix-icon="Search"
        clearable
      />
    </div>

    <ElTabs v-model="activeTab" type="card" class="reference-tabs">
      <ElTabPane label="Invoicing Items" name="invoicing">
        <div class="flex flex-col h-full">
          <div class="info-card mb-4 flex-shrink-0">
            <ElCard shadow="hover">
              <div class="flex items-start">
                <ElIcon class="mr-2 mt-1" color="var(--color-primary)"><InfoFilled /></ElIcon>
                <div class="text-sm text-gray-600">
                  <p class="font-medium mb-1">Usage in Expressions:</p>
                  <code class="bg-gray-100 px-1 py-0.5 rounded text-xs">#invoicingItems['ITEM_NAME']</code>
                  <p class="mt-1">Access properties: <code>?.netAmount?.value</code>, <code>?.grossAmount?.value</code>, <code>?.amount?.value</code></p>
                </div>
              </div>
            </ElCard>
          </div>
          
          <div class="flex-1 overflow-hidden">
            <ElTable :data="filteredInvoicingItems" style="width: 100%" height="100%">
              <ElTableColumn prop="name" label="Name" width="300" sortable>
                <template #default="{ row }">
                  <span class="font-mono text-xs font-medium">{{ row.name }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="sourceType" label="Type" width="210" sortable>
                <template #default="{ row }">
                  <ElTag :type="getTypeColor(row.sourceType)" size="small">{{ row.sourceType }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="description" label="Description" />
            </ElTable>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane label="Metadata Variables" name="metadata">
        <div class="flex flex-col h-full">
          <div class="info-card mb-4 flex-shrink-0">
            <ElCard shadow="hover">
              <div class="flex items-start">
                <ElIcon class="mr-2 mt-1" color="var(--color-primary)"><InfoFilled /></ElIcon>
                <div class="text-sm text-gray-600">
                  <p class="font-medium mb-1">Usage in Expressions:</p>
                  <p>Use variables directly as shown in the Name column.</p>
                </div>
              </div>
            </ElCard>
          </div>

          <div class="flex-1 overflow-hidden">
            <ElTable :data="filteredMetadataVariables" style="width: 100%" height="100%">
              <ElTableColumn prop="name" label="Name" width="300" sortable>
                <template #default="{ row }">
                  <span class="font-mono text-xs font-medium">{{ row.name }}</span>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="type" label="Type" width="150" sortable>
                <template #default="{ row }">
                  <ElTag size="small" effect="plain">{{ row.type }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="description" label="Description" />
            </ElTable>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane label="Standard Prefixes" name="prefixes">
        <div class="prefixes-content h-full overflow-y-auto pr-2">
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-2">#input</h3>
            <p class="text-gray-600 mb-2">Access to the raw order input data.</p>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li><code>#input.orderMetadata</code> - Access order metadata properties</li>
              <li><code>#input.operation.name()</code> - Get operation name (e.g. 'complete')</li>
              <li><code>#input.processingTime</code> - Order processing timestamp</li>
            </ul>
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-2">#invoicingItems</h3>
            <p class="text-gray-600 mb-2">Map containing all calculated invoicing items for this order.</p>
            <p class="text-sm text-gray-600 mb-2">Syntax: <code>#invoicingItems['ITEM_NAME']</code></p>
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-800 mb-2">Global Variables</h3>
            <p class="text-gray-600 mb-2">Context variables available directly:</p>
            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li><code>#financialSourceCountryCodeValue</code> - Country code (e.g. 'ES')</li>
              <li><code>#currencyCodeValue</code> - Currency code (e.g. 'EUR')</li>
              <li><code>#cityCodeValue</code> - City code</li>
              <li><code>#isVatOptimisedOrder</code> - Boolean flag for VAT optimization</li>
            </ul>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.reference-section {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  margin-bottom: 1.5rem;
}

.font-mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
}

.reference-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.reference-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

.reference-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

