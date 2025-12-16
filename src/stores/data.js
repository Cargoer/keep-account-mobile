import { defineStore } from 'pinia'
import { ref } from 'vue'

import { getEnumValues } from '@/request/supabase.js'

export const useDataStore = defineStore('data', () => {
  const recordTypes = ref([])
  const categories = ref([])
  const paymentMethods = ref([])

  async function initEnums () {
    recordTypes.value = await getEnumValues('recordType')
    categories.value = await getEnumValues('category')
    paymentMethods.value = await getEnumValues('payWay')
  }
  
  return {
    recordTypes,
    categories,
    paymentMethods,
    initEnums,
  }
})