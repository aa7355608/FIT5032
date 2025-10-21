<template>
  <div class="flex gap-1 items-center">
    <button
      v-for="i in max"
      :key="i"
      type="button"
      :aria-label="`Rate ${i}`"
      @click="update(i)"
      @mouseover="hover = i"
      @mouseleave="hover = 0"
      :disabled="readonly"
      style="border:none;background:none;font-size:24px;cursor:pointer;line-height:1"
      title="Click to rate"
    >
      <span>{{ (hover || modelValue) >= i ? '★' : '☆' }}</span>
    </button>
    <span style="margin-left:6px">{{ modelValue }}/{{ max }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  max?: number
  readonly?: boolean
}>(), {
  modelValue: 0,
  max: 5,
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const hover = ref(0)
const max = computed(() => props.max)

function update(v: number) {
  if (props.readonly) return
  emit('update:modelValue', v)
}
</script>

<style scoped>

</style>
