<script setup lang="ts">
import { computed } from 'vue'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption, ElSwitch, ElDivider } from 'element-plus'
import type { TestOrderData } from '@/types/order-data'

const props = defineProps<{
  modelValue: TestOrderData | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TestOrderData): void
  (e: 'change'): void
}>()

// Helper to safely update nested properties
function updateMetadata(field: string, value: any) {
  if (!props.modelValue) return

  const newInput = { ...props.modelValue.input }
  const newMetadata = { ...newInput.orderMetadata, [field]: value }
  newInput.orderMetadata = newMetadata

  emit('update:modelValue', {
    ...props.modelValue,
    input: newInput
  })
  emit('change')
}

function updateTopLevel(field: keyof TestOrderData, value: any) {
  if (!props.modelValue) return

  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
  emit('change')
}

const handlingStrategies = ['GEN1', 'GEN2', 'PICKUP']

// Computed properties for v-model binding to make the template cleaner
const metadata = computed(() => props.modelValue?.input.orderMetadata)
</script>

<template>
  <div class="metadata-editor h-full overflow-auto p-4">
    <ElForm v-if="modelValue && metadata" label-position="top" size="small">
      <!-- Context Variables -->
      <div class="section-title text-sm font-bold text-gray-700 mb-3">Context Variables</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ElFormItem label="Country Code">
          <ElInput 
            :model-value="modelValue.financialSourceCountryCodeValue" 
            @update:model-value="v => updateTopLevel('financialSourceCountryCodeValue', v)"
          />
        </ElFormItem>
        <ElFormItem label="Currency">
          <ElInput 
            :model-value="modelValue.currencyCodeValue" 
            @update:model-value="v => updateTopLevel('currencyCodeValue', v)"
          />
        </ElFormItem>
        <ElFormItem label="City Code">
          <ElInput 
            :model-value="modelValue.cityCodeValue" 
            @update:model-value="v => updateTopLevel('cityCodeValue', v)"
          />
        </ElFormItem>
        <ElFormItem label="VAT Optimised">
          <ElSwitch 
            :model-value="modelValue.isVatOptimisedOrder" 
            @update:model-value="v => updateTopLevel('isVatOptimisedOrder', v)"
          />
        </ElFormItem>
      </div>

      <ElDivider />

      <!-- Order Metadata -->
      <div class="section-title text-sm font-bold text-gray-700 mb-3">Order Details</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ElFormItem label="Order ID">
          <ElInputNumber 
            :model-value="metadata.orderId" 
            @update:model-value="v => updateMetadata('orderId', v)"
            class="w-full"
            :controls="false"
          />
        </ElFormItem>
        <ElFormItem label="Order Code">
          <ElInput 
            :model-value="metadata.orderCode" 
            @update:model-value="v => updateMetadata('orderCode', v)"
          />
        </ElFormItem>
        <ElFormItem label="Handling Strategy">
          <ElSelect 
            :model-value="metadata.handlingStrategy" 
            @update:model-value="v => updateMetadata('handlingStrategy', v)"
            class="w-full"
          >
            <ElOption v-for="opt in handlingStrategies" :key="opt" :label="opt" :value="opt" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Store Address ID">
          <ElInputNumber 
            :model-value="metadata.storeAddressId" 
            @update:model-value="v => updateMetadata('storeAddressId', v)"
            class="w-full"
            :controls="false"
          />
        </ElFormItem>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <ElFormItem label="Partner Family">
          <ElInput 
            :model-value="metadata.partnerFamily" 
            @update:model-value="v => updateMetadata('partnerFamily', v)"
          />
        </ElFormItem>
        <ElFormItem label="Vertical">
          <ElInput 
            :model-value="metadata.vertical" 
            @update:model-value="v => updateMetadata('vertical', v)"
          />
        </ElFormItem>
        <ElFormItem label="Sub-vertical">
          <ElInput 
            :model-value="metadata.subvertical" 
            @update:model-value="v => updateMetadata('subvertical', v)"
          />
        </ElFormItem>
      </div>

      <ElDivider />

      <!-- Timestamps -->
      <div class="section-title text-sm font-bold text-gray-700 mb-3">Timestamps</div>
      <div class="grid grid-cols-1 gap-4">
        <ElFormItem label="Creation Time">
          <ElInput 
            :model-value="metadata.orderCreationTime" 
            @update:model-value="v => updateMetadata('orderCreationTime', v)"
          />
        </ElFormItem>
        <ElFormItem label="Dispatching Time">
          <ElInput 
            :model-value="metadata.orderDispatchingTime" 
            @update:model-value="v => updateMetadata('orderDispatchingTime', v)"
          />
        </ElFormItem>
        <ElFormItem label="Final Status Time">
          <ElInput 
            :model-value="metadata.finalStatusDateTime" 
            @update:model-value="v => updateMetadata('finalStatusDateTime', v)"
          />
        </ElFormItem>
      </div>

      <ElDivider />

      <!-- Strategies -->
      <div class="section-title text-sm font-bold text-gray-700 mb-3">Cancellation Strategies</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ElFormItem label="Partner Strategy">
          <ElInput 
            :model-value="metadata.partnerCancellationStrategy" 
            @update:model-value="v => updateMetadata('partnerCancellationStrategy', v)"
          />
        </ElFormItem>
        <ElFormItem label="Customer Strategy">
          <ElInput 
            :model-value="metadata.customerCancellationStrategy" 
            @update:model-value="v => updateMetadata('customerCancellationStrategy', v)"
          />
        </ElFormItem>
      </div>

    </ElForm>
    <div v-else class="text-center text-gray-500 mt-10">
      No data loaded
    </div>
  </div>
</template>

<style scoped>
.metadata-editor {
  background-color: white;
}
:deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>

