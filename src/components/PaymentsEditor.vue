<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElTable, ElTableColumn, ElInputNumber, ElInput, ElButton, ElCard, ElEmpty } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { TestOrderData, Payment } from '@/types/order-data'

const props = defineProps<{
  modelValue: TestOrderData | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TestOrderData): void
  (e: 'change'): void
}>()

const payments = ref<Payment[]>([])

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue?.input?.orderMetadata?.payments) {
      payments.value = []
      return
    }
    payments.value = newValue.input.orderMetadata.payments.map(payment => ({
      amount: payment.amount ?? 0,
      paymentMethod: payment.paymentMethod || '',
      clearingProvider: payment.clearingProvider || ''
    }))
  },
  { immediate: true, deep: true }
)

function emitUpdate() {
  if (!props.modelValue?.input?.orderMetadata) return

  const updated: TestOrderData = {
    ...props.modelValue,
    input: {
      ...props.modelValue.input,
      orderMetadata: {
        ...props.modelValue.input.orderMetadata,
        payments: payments.value.map(payment => ({
          amount: payment.amount ?? 0,
          paymentMethod: payment.paymentMethod || '',
          clearingProvider: payment.clearingProvider || ''
        }))
      }
    }
  }

  emit('update:modelValue', updated)
  emit('change')
}

function addPayment() {
  payments.value.push({
    amount: 0,
    paymentMethod: '',
    clearingProvider: ''
  })
  emitUpdate()
}

function removePayment(index: number) {
  payments.value.splice(index, 1)
  emitUpdate()
}

function handleFieldChange() {
  emitUpdate()
}
</script>

<template>
  <ElCard class="payments-editor h-full flex flex-col" :body-style="{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }">
    <template #header>
      <div class="card-header">
        <span class="text-base font-semibold">Payments</span>
        <ElButton size="small" type="primary" :icon="Plus" @click="addPayment">Add Payment</ElButton>
      </div>
    </template>

    <div class="table-container flex-1 overflow-auto">
      <ElTable
        v-if="payments.length > 0"
        :data="payments"
        stripe
        style="width: 100%"
        size="small"
      >
        <ElTableColumn label="#" width="60">
          <template #default="{ $index }">
            <span class="text-gray-500 text-sm">{{ $index + 1 }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Amount" min-width="140">
          <template #default="{ row }">
            <ElInputNumber
              v-model="row.amount"
              :precision="2"
              :step="0.1"
              size="small"
              :controls="false"
              @change="handleFieldChange"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn label="Payment Method" min-width="180">
          <template #default="{ row }">
            <ElInput
              v-model="row.paymentMethod"
              placeholder="CARD, CASH..."
              size="small"
              @change="handleFieldChange"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn label="Clearing Provider" min-width="200">
          <template #default="{ row }">
            <ElInput
              v-model="row.clearingProvider"
              placeholder="Optional"
              size="small"
              @change="handleFieldChange"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn label="Actions" width="100" align="center">
          <template #default="{ $index }">
            <ElButton
              type="danger"
              size="small"
              :icon="Delete"
              circle
              plain
              @click="removePayment($index)"
            />
          </template>
        </ElTableColumn>
      </ElTable>

      <div v-else class="h-full flex items-center justify-center">
        <ElEmpty description="No payments configured" :image-size="100" />
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.payments-editor {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>


