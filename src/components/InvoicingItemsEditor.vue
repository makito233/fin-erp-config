<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElTable, ElTableColumn, ElInputNumber, ElCard, ElEmpty, ElSelect, ElOption, ElButton, ElSwitch, ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config-store'
import type { InvoicingItemAmount } from '@/types/invoicing-items'
import type { TestOrderData } from '@/types/order-data'

const props = defineProps<{
  modelValue: TestOrderData | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TestOrderData): void
  (e: 'change'): void
}>()

interface EditableItem {
  name: string
  grossAmount: number
  netAmount: number
  amount: number
  hasTaxDetails: boolean
}

const configStore = useConfigStore()
const items = ref<EditableItem[]>([])
const newItemName = ref('')
const newItemHasTaxDetails = ref(true)
const itemTaxMeta = ref<Record<string, boolean>>({})

const availableItems = computed(() => configStore.invoicingItems.map(item => item.name))

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue || !newValue.invoicingItems) {
      items.value = []
      itemTaxMeta.value = {}
      return
    }

    items.value = Object.entries(newValue.invoicingItems).map(([name, data]) => {
      const hasTaxDetails = itemTaxMeta.value[name] ?? !!data.grossAmount
      const baseAmount = data.amount?.value ?? data.netAmount?.value ?? data.grossAmount?.value ?? 0
      const row: EditableItem = {
        name,
        grossAmount: data.grossAmount?.value ?? baseAmount,
        netAmount: data.netAmount?.value ?? baseAmount,
        amount: baseAmount,
        hasTaxDetails
      }

      if (itemTaxMeta.value[name] === undefined) {
        itemTaxMeta.value[name] = hasTaxDetails
      }

      return row
    })
  },
  { immediate: true }
)

function buildInvoicingMap() {
  const map: Record<string, InvoicingItemAmount> = {}
  items.value.forEach(item => {
    if (!item.name) {
      return
    }
    const payload: InvoicingItemAmount = {}
    if (item.hasTaxDetails) {
      payload.netAmount = { value: item.netAmount }
      payload.grossAmount = { value: item.grossAmount }
    } else {
      payload.amount = { value: item.amount }
      payload.netAmount = { value: item.amount }
      payload.grossAmount = { value: item.amount }
    }
    map[item.name] = payload
    itemTaxMeta.value[item.name] = item.hasTaxDetails
  })
  return map
}

function emitUpdatedData() {
  if (!props.modelValue) return

  const updatedData: TestOrderData = {
    ...props.modelValue,
    invoicingItems: buildInvoicingMap()
  }

  emit('update:modelValue', updatedData)
  emit('change')
}

function handleValueChange() {
  emitUpdatedData()
}

function addNewItem() {
  const name = newItemName.value.trim()
  if (!name) {
    ElMessage.warning('Please select or enter an invoicing item name')
    return
  }
  if (items.value.some(item => item.name === name)) {
    ElMessage.warning('This invoicing item is already in the list')
    return
  }

  items.value.push({
    name,
    grossAmount: 0,
    netAmount: 0,
    amount: 0,
    hasTaxDetails: newItemHasTaxDetails.value
  })
  itemTaxMeta.value[name] = newItemHasTaxDetails.value

  emitUpdatedData()
  newItemName.value = ''
  newItemHasTaxDetails.value = true
}

function removeItem(name: string) {
  items.value = items.value.filter(item => item.name !== name)
  delete itemTaxMeta.value[name]
  emitUpdatedData()
}
</script>

<template>
  <ElCard class="invoicing-items-editor h-full flex flex-col" :body-style="{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }">
    <template #header>
      <div class="card-header">
        <span class="text-base font-semibold">Invoicing Items</span>
        <div class="add-item-controls flex items-center gap-2">
          <ElSelect
            v-model="newItemName"
            filterable
            allow-create
            default-first-option
            placeholder="Select or type item"
            style="min-width: 220px"
            size="small"
          >
            <ElOption
              v-for="item in availableItems"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span>Taxable</span>
            <ElSwitch v-model="newItemHasTaxDetails" size="small" />
          </div>
          <ElButton type="primary" size="small" :icon="Plus" @click="addNewItem">
            Add Item
          </ElButton>
        </div>
      </div>
    </template>
    
    <div class="table-container flex-1 overflow-auto">
      <ElTable 
        v-if="items.length > 0"
        :data="items" 
        stripe 
        style="width: 100%" 
        size="small"
      >
        <ElTableColumn prop="name" label="Item Name" min-width="200" show-overflow-tooltip fixed />

        <ElTableColumn label="Type" width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <ElSwitch
                v-model="row.hasTaxDetails"
                active-text="Taxable"
                inactive-text="Amount"
                size="small"
                inline-prompt
                @change="handleValueChange"
              />
            </div>
          </template>
        </ElTableColumn>
        
        <ElTableColumn label="Values" min-width="320">
          <template #default="{ row }">
            <div v-if="row.hasTaxDetails" class="flex gap-2">
              <div class="flex flex-col gap-1 flex-1">
                <span class="text-xs text-gray-500">Net</span>
                <ElInputNumber 
                  v-model="row.netAmount" 
                  :precision="2" 
                  :step="0.1" 
                  size="small"
                  :controls="false"
                  @change="handleValueChange"
                />
              </div>
              <div class="flex flex-col gap-1 flex-1">
                <span class="text-xs text-gray-500">Gross</span>
                <ElInputNumber 
                  v-model="row.grossAmount" 
                  :precision="2" 
                  :step="0.1" 
                  size="small"
                  :controls="false"
                  @change="handleValueChange"
                />
              </div>
            </div>
            <div v-else>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-gray-500">Amount</span>
                <ElInputNumber 
                  v-model="row.amount" 
                  :precision="2" 
                  :step="0.1" 
                  size="small"
                  :controls="false"
                  @change="handleValueChange"
                />
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Actions" width="110" align="center">
          <template #default="{ row }">
            <ElButton
              type="danger"
              size="small"
              :icon="Delete"
              circle
              plain
              @click="removeItem(row.name)"
            />
          </template>
        </ElTableColumn>
      </ElTable>
      
      <div v-else class="h-full flex items-center justify-center">
        <ElEmpty description="No invoicing items data" :image-size="100" />
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.invoicing-items-editor {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.add-item-controls {
  flex-wrap: wrap;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>

