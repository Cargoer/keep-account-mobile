import { createClient } from '@supabase/supabase-js'
import moment from 'moment'
import { ElMessage } from 'element-plus'

const supabaseUrl = 'https://gqdvyokwrbrhefxufxua.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function queryMonthlyRecords (year, month) {
  const monthStart = moment(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD')
  const monthEnd = moment(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD')
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .gte('createDate', monthStart)
    .lte('createDate', monthEnd)
  if (error) {
    // ElMessage.error(error.message)
    throw error
  }
  return data
}

export async function queryDailyRecords (date) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('createDate', date)
  if (error) {
    ElMessage.error(error.message)
    throw error
  }
  return data
}

export async function getDailyStatisticsOfMonth (yearAndMonth) {
  const { data, error } = await supabase.rpc('get_daily_statistics_of_month', {
    year_and_month: yearAndMonth
  })
  if (error) {
    // ElMessage.error(error.message)
    console.error(error.message)
    throw error
  }
  return data
}

export async function getEnumValues (enumName) {
  const { data, error } = await supabase.rpc('get_enum_values', {
    enum_name: enumName
  })
  if (error) {
    ElMessage.error(error.message)
    throw error
  }
  return data
}

export async function insertRecord (record) {
  const { data, error } = await supabase
    .from('records')
    .insert([record])
    .select()
  if (error) {
    ElMessage.error(error.message)
    throw error
  } else {
    ElMessage.success('记账成功')
  }
}

export async function getFinanceStats (yearAndMonth) {
  const [year, month] = yearAndMonth.split('-').map(v => parseInt(v))
  const { data, error } = await supabase.rpc('get_finance_stats', {
    target_year: year,
    target_month: month
  })
  if (error) {
    ElMessage.error(error.message)
    throw error
  }
  return data
}