<script setup lang="ts">
import { ref } from 'vue'
import { ElDialog, ElInput, ElButton, ElTable, ElTableColumn, ElMessage, ElAlert } from 'element-plus'
import { mapToTestOrderData, type FtTransaction, type FtOrderResponse } from '@/services/ft-service'
import type { TestOrderData } from '@/types/order-data'

const emit = defineEmits<{
  (e: 'success', data: TestOrderData): void
  (e: 'update:modelValue', value: boolean): void
}>()

defineProps<{
  modelValue: boolean
}>()

const transactionsInput = ref('')
const orderInput = ref('')
const transactions = ref<FtTransaction[]>([])
const orderDetails = ref<FtOrderResponse['data'] | null>(null)
const step = ref<'input' | 'select'>('input')
const isLoading = ref(false)

function reset() {
  transactionsInput.value = ''
  orderInput.value = ''
  transactions.value = []
  orderDetails.value = null
  step.value = 'input'
}

function parseTransactionsText(): FtTransaction[] {
  const raw = transactionsInput.value.trim()
  if (!raw) {
    throw new Error('Please paste the Transactions JSON payload')
  }
  const parsed = JSON.parse(raw)
  if (Array.isArray(parsed)) {
    return parsed as FtTransaction[]
  }
  if (parsed && Array.isArray(parsed.data)) {
    return parsed.data as FtTransaction[]
  }
  throw new Error('Transactions JSON must contain a "data" array or be an array directly')
}

function parseOrderText(): FtOrderResponse['data'] {
  const raw = orderInput.value.trim()
  if (!raw) {
    throw new Error('Please paste the Order JSON payload')
  }
  const parsed = JSON.parse(raw)
  if (parsed?.data) {
    return parsed.data
  }
  return parsed
}

function prepareSelection() {
  try {
    isLoading.value = true
    const parsedTransactions = parseTransactionsText()
    const parsedOrder = parseOrderText()

    if (!parsedTransactions.length) {
      ElMessage.info('No transactions found in the provided JSON')
      return
    }

    transactions.value = parsedTransactions
    orderDetails.value = parsedOrder

    if (parsedTransactions.length === 1) {
      selectTransaction(parsedTransactions[0])
    } else {
      step.value = 'select'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error(message)
  } finally {
    isLoading.value = false
  }
}

function selectTransaction(transaction: FtTransaction) {
  if (!orderDetails.value) {
    ElMessage.error('Order JSON is missing or invalid')
    return
  }

  try {
    const mappedData = mapToTestOrderData(transaction, orderDetails.value)
    emit('success', mappedData)
    emit('update:modelValue', false)
    ElMessage.success('Order data loaded successfully')
    reset()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    ElMessage.error(`Failed to load data: ${message}`)
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    @update:model-value="handleClose"
    title="Load Financial Troubleshooter Data"
    width="720px"
    append-to-body
  >
    <div v-loading="isLoading">
      <div v-if="step === 'input'" class="ft-input-step flex flex-col gap-4">
        <ElAlert
          type="info"
          show-icon
          :closable="false"
          title="Paste the JSON payloads returned by the Financial Troubleshooter endpoints."
          description="Copy the /transactions response into the first box and the /order response into the second box."
        />
        <div class="ft-textareas grid gap-4 md:grid-cols-2">
          <ElInput
            v-model="transactionsInput"
            type="textarea"
            :rows="12"
            placeholder='{"data": [ ...transactions... ]}'
            resize="vertical"
          />
          <ElInput
            v-model="orderInput"
            type="textarea"
            :rows="12"
            placeholder='{"data": { "order": { ... } }}'
            resize="vertical"
          />
        </div>
        <div class="flex justify-end">
          <ElButton type="primary" @click="prepareSelection">
            Preview Transactions
          </ElButton>
        </div>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">Select a transaction to load:</span>
          <ElButton link type="primary" @click="step = 'input'">
            Back to Input
          </ElButton>
        </div>

        <ElTable :data="transactions" stripe style="width: 100%">
          <ElTableColumn prop="id" label="Transaction ID" show-overflow-tooltip />
          <ElTableColumn label="Timestamp" width="200">
            <template #default="{ row }">
              {{ formatDate(row.timestamp) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="Action" width="100" align="right">
            <template #default="{ row }">
              <ElButton size="small" @click="selectTransaction(row)">
                Load
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>
  </ElDialog>
</template>

