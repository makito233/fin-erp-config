import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SapConfig, ValidationError, MetadataVariable, InvoicingItem } from '@/types'
import type { TestOrderData } from '@/types'
import { normalizeTestData } from '@/utils/test-data'

export const useConfigStore = defineStore('config', () => {
  // State
  const config = ref<SapConfig | null>(null)
  const fileName = ref<string>('')
  const validationErrors = ref<ValidationError[]>([])
  const testData = ref<TestOrderData | null>(null)
  const invoicingItems = ref<InvoicingItem[]>([])
  const metadataVariables = ref<MetadataVariable[]>([])
  const isLoading = ref(false)
  const savedFiles = ref<Array<{ id: string, name: string, content: string, date: string }>>([])

  // Initialize saved files from localStorage
  const saved = localStorage.getItem('sap_config_history')
  if (saved) {
    try {
      savedFiles.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse saved configs', e)
    }
  }

  // Initialize current session from localStorage
  const currentSession = localStorage.getItem('sap_config_current')
  if (currentSession) {
    try {
      const session = JSON.parse(currentSession)
      config.value = session.config
      fileName.value = session.fileName
    } catch (e) {
      console.error('Failed to parse current session', e)
    }
  }

  function saveSession() {
    if (config.value) {
      try {
        localStorage.setItem('sap_config_current', JSON.stringify({
          config: config.value,
          fileName: fileName.value
        }))
      } catch (e) {
        console.error('Failed to save current session', e)
      }
    } else {
      localStorage.removeItem('sap_config_current')
    }
  }

  // Computed
  const hasErrors = computed(() => 
    validationErrors.value.some(e => e.severity === 'error')
  )

  const hasWarnings = computed(() => 
    validationErrors.value.some(e => e.severity === 'warning')
  )

  const errorCount = computed(() => 
    validationErrors.value.filter(e => e.severity === 'error').length
  )

  const warningCount = computed(() => 
    validationErrors.value.filter(e => e.severity === 'warning').length
  )

  const isConfigLoaded = computed(() => config.value !== null)

  // Actions
  function saveToHistory(_config: SapConfig, fileName: string, content: string) {
    const newFile = {
      id: crypto.randomUUID(),
      name: fileName,
      content,
      date: new Date().toISOString()
    }
    
    // Check if file with same name exists and replace it, otherwise add to top
    const existingIndex = savedFiles.value.findIndex(f => f.name === fileName)
    if (existingIndex >= 0) {
      savedFiles.value[existingIndex] = newFile
    } else {
      savedFiles.value.unshift(newFile)
    }
    
    // Limit to 10 saved files
    if (savedFiles.value.length > 10) {
      savedFiles.value = savedFiles.value.slice(0, 10)
    }
    
    localStorage.setItem('sap_config_history', JSON.stringify(savedFiles.value))
  }

  function loadFromHistory(id: string) {
    const file = savedFiles.value.find(f => f.id === id)
    return file
  }

  function deleteFromHistory(id: string) {
    savedFiles.value = savedFiles.value.filter(f => f.id !== id)
    localStorage.setItem('sap_config_history', JSON.stringify(savedFiles.value))
  }

  function clearHistory() {
    savedFiles.value = []
    localStorage.removeItem('sap_config_history')
  }

  function loadConfig(newConfig: SapConfig, file: string) {
    config.value = newConfig
    fileName.value = file
    validationErrors.value = []
    saveSession()
  }

  function updateFieldMapping(fieldName: string, mapping: any) {
    if (!config.value) return
    config.value.fieldMappings[fieldName] = mapping
    saveSession()
  }

  function updateConditionMapping(index: number, mapping: any) {
    if (!config.value) return
    config.value.conditionMappings[index] = mapping
    saveSession()
  }

  function addConditionMapping(mapping: any) {
    if (!config.value) return
    config.value.conditionMappings.push(mapping)
    saveSession()
  }

  function removeConditionMapping(index: number) {
    if (!config.value) return
    config.value.conditionMappings.splice(index, 1)
    saveSession()
  }

  function setValidationErrors(errors: ValidationError[]) {
    validationErrors.value = errors
  }

  function clearValidationErrors() {
    validationErrors.value = []
  }

  function loadTestData(data: TestOrderData) {
    const normalized = normalizeTestData(data)
    testData.value = normalized
    return normalized
  }

  function clearTestData() {
    testData.value = null
  }

  function loadInvoicingItems(items: InvoicingItem[]) {
    invoicingItems.value = items
  }

  function loadMetadataVariables(variables: MetadataVariable[]) {
    metadataVariables.value = variables
  }

  function clearConfig() {
    config.value = null
    fileName.value = ''
    validationErrors.value = []
    testData.value = null
    saveSession()
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  return {
    // State
    config,
    fileName,
    validationErrors,
    testData,
    invoicingItems,
    metadataVariables,
    isLoading,
    savedFiles,

    // Computed
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    isConfigLoaded,

    // Actions
    loadConfig,
    saveToHistory,
    loadFromHistory,
    deleteFromHistory,
    clearHistory,
    updateFieldMapping,
    updateConditionMapping,
    addConditionMapping,
    removeConditionMapping,
    setValidationErrors,
    clearValidationErrors,
    loadTestData,
    clearTestData,
    loadInvoicingItems,
    loadMetadataVariables,
    clearConfig,
    setLoading,
  }
})

