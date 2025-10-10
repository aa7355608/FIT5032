<template>
  <div class="card">
    <div class="row" style="justify-content:space-between; margin-bottom:8px;">
      <strong>{{ title }}</strong>
      <div class="muted">Rows: {{ filteredRows.length }} • Page {{ page }} / {{ totalPages }}</div>
    </div>

    <div class="grid" style="gap:8px; margin-bottom:8px;">
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <div v-for="col in columns" :key="col.field" style="min-width:160px;">
          <label>{{ col.label }} (search)</label>
          <input class="input" v-model="filters[col.field]" :placeholder="`Search ${col.label}`" />
        </div>
      </div>
    </div>

    <div style="overflow:auto;">
      <table>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.field" @click="toggleSort(col.field)" style="cursor:pointer; white-space:nowrap;">
              {{ col.label }}
              <span v-if="sort.field === col.field">{{ sort.dir === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pageRows" :key="row.__key">
            <td v-for="col in columns" :key="col.field">{{ row[col.field] }}</td>
          </tr>
          <tr v-if="pageRows.length === 0">
            <td :colspan="columns.length" class="muted">No data</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="row" style="gap:8px; justify-content:flex-end; margin-top:8px;">
      <button class="btn ghost" @click="prev" :disabled="page===1">Prev</button>
      <span class="muted">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn ghost" @click="next" :disabled="page===totalPages">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

type Column = { label: string; field: string }

const props = defineProps<{
  title: string
  columns: Column[]
  rows: Record<string, any>[]
  pageSize?: number
}>()

const page = ref(1)
const pageSize = computed(() => props.pageSize ?? 10)
const sort = reactive<{ field: string; dir: 'asc'|'desc' }>({ field: props.columns[0]?.field || '', dir: 'asc' })
const filters = reactive<Record<string, string>>({})


const keyedRows = computed(() =>
  props.rows.map((r, i) => ({ __key: i + '_' + (r.id ?? ''), ...r }))
)

const filteredRows = computed(() => {
  let out = keyedRows.value
  for (const col of props.columns) {
    const val = (filters[col.field] || '').trim().toLowerCase()
    if (val) {
      out = out.filter((r) => String(r[col.field] ?? '').toLowerCase().includes(val))
    }
  }
  return out
})


const sortedRows = computed(() => {
  const arr = [...filteredRows.value]
  if (!sort.field) return arr
  arr.sort((a, b) => {
    const av = a[sort.field]; const bv = b[sort.field]
    if (av == null && bv == null) return 0
    if (av == null) return sort.dir === 'asc' ? -1 : 1
    if (bv == null) return sort.dir === 'asc' ? 1 : -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return sort.dir === 'asc' ? av - bv : bv - av
    }
    return sort.dir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })
  return arr
})


const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / pageSize.value)))
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedRows.value.slice(start, start + pageSize.value)
})

function toggleSort(field: string) {
  if (sort.field === field) {
    sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'
  } else {
    sort.field = field
    sort.dir = 'asc'
  }
}
function prev() { if (page.value > 1) page.value-- }
function next() { if (page.value < totalPages.value) page.value++ }


watch([() => JSON.stringify(filters), () => sort.field, () => sort.dir], () => { page.value = 1 })
</script>
