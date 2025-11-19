<script setup lang="ts">
import { computed } from 'vue'
import { ElAlert, ElBadge, ElCollapse, ElCollapseItem } from 'element-plus'
import { useConfigStore } from '@/stores/config-store'
import type { ValidationError } from '@/types'

const configStore = useConfigStore()

const errors = computed(() => 
  configStore.validationErrors.filter(e => e.severity === 'error')
)

const warnings = computed(() => 
  configStore.validationErrors.filter(e => e.severity === 'warning')
)

const infos = computed(() => 
  configStore.validationErrors.filter(e => e.severity === 'info')
)

function getLocationText(error: ValidationError): string {
  const parts: string[] = []
  
  if (error.location?.fieldName) {
    parts.push(`Field: ${error.location.fieldName}`)
  }
  
  if (error.location?.conditionType) {
    parts.push(`Condition: ${error.location.conditionType}`)
  }
  
  if (error.location?.country) {
    parts.push(`Country: ${error.location.country}`)
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'General'
}
</script>

<template>
  <div class="validation-panel">
    <div class="panel-header">
      <h3 class="text-lg font-semibold text-gray-900">Validation</h3>
      <div class="badges">
        <ElBadge
          v-if="errors.length > 0"
          :value="errors.length"
          type="danger"
          class="mr-2"
        >
          <span class="badge-label">Errors</span>
        </ElBadge>
        <ElBadge
          v-if="warnings.length > 0"
          :value="warnings.length"
          type="warning"
          class="mr-2"
        >
          <span class="badge-label">Warnings</span>
        </ElBadge>
        <ElBadge
          v-if="infos.length > 0"
          :value="infos.length"
          type="info"
        >
          <span class="badge-label">Info</span>
        </ElBadge>
      </div>
    </div>

    <div v-if="configStore.validationErrors.length === 0" class="empty-state">
      <ElAlert
        title="No validation issues"
        type="success"
        :closable="false"
        show-icon
      />
    </div>

    <div v-else class="validation-list">
      <ElCollapse>
        <ElCollapseItem
          v-if="errors.length > 0"
          title="Errors"
          name="errors"
        >
          <template #title>
            <span class="collapse-title text-error">
              Errors ({{ errors.length }})
            </span>
          </template>
          <div class="validation-items">
            <ElAlert
              v-for="error in errors"
              :key="error.id"
              :title="error.message"
              type="error"
              :closable="false"
              show-icon
              class="mb-2"
            >
              <template #default>
                <div class="text-xs text-gray-600 mt-1">
                  {{ getLocationText(error) }}
                </div>
              </template>
            </ElAlert>
          </div>
        </ElCollapseItem>

        <ElCollapseItem
          v-if="warnings.length > 0"
          title="Warnings"
          name="warnings"
        >
          <template #title>
            <span class="collapse-title text-warning">
              Warnings ({{ warnings.length }})
            </span>
          </template>
          <div class="validation-items">
            <ElAlert
              v-for="warning in warnings"
              :key="warning.id"
              :title="warning.message"
              type="warning"
              :closable="false"
              show-icon
              class="mb-2"
            >
              <template #default>
                <div class="text-xs text-gray-600 mt-1">
                  {{ getLocationText(warning) }}
                </div>
              </template>
            </ElAlert>
          </div>
        </ElCollapseItem>

        <ElCollapseItem
          v-if="infos.length > 0"
          title="Info"
          name="infos"
        >
          <template #title>
            <span class="collapse-title text-info">
              Info ({{ infos.length }})
            </span>
          </template>
          <div class="validation-items">
            <ElAlert
              v-for="info in infos"
              :key="info.id"
              :title="info.message"
              type="info"
              :closable="false"
              show-icon
              class="mb-2"
            >
              <template #default>
                <div class="text-xs text-gray-600 mt-1">
                  {{ getLocationText(info) }}
                </div>
              </template>
            </ElAlert>
          </div>
        </ElCollapseItem>
      </ElCollapse>
    </div>
  </div>
</template>

<style scoped>
.validation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.badges {
  display: flex;
  align-items: center;
}

.badge-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.empty-state {
  padding: 1rem;
}

.validation-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.validation-items {
  padding: 0.5rem 0;
}

.collapse-title {
  font-weight: 600;
}

.text-error {
  color: var(--color-error);
}

.text-warning {
  color: var(--color-warning);
}

.text-info {
  color: var(--color-info);
}
</style>

