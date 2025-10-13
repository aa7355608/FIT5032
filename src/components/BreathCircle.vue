<template>
  <div class="circle-wrap" :aria-label="`Phase: ${phase} ${remaining}s`">
    <svg viewBox="0 0 120 120" class="circle">
      <circle cx="60" cy="60" r="56" class="ring" />
      <g :class="['dot', phaseClass]" :style="dotStyle">
        <circle cx="60" cy="60" r="12" />
      </g>
    </svg>
    <div class="label">
      <div class="phase">{{ phase.toUpperCase() }}</div>
      <div class="timer">{{ remaining }}s</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  phase: 'inhale'|'hold'|'exhale'|'idle',
  remaining: number,           
  progress: number              
}>()


const phaseClass = computed(() => props.phase)
const dotStyle = computed(() => {
 
  let scale = 1
  if (props.phase === 'inhale') scale = 0.6 + 0.4 * props.progress
  if (props.phase === 'hold')   scale = 1.0
  if (props.phase === 'exhale') scale = 1.0 - 0.4 * props.progress
  if (props.phase === 'idle')   scale = 0.8
  return { transform: `scale(${scale})` }
})
</script>

<style scoped>
.circle-wrap {
  position: relative;
  width: 260px;
  height: 260px;
  margin: 0 auto;
}
.circle {
  width: 100%; height: 100%;
}
.ring {
  fill: none;
  stroke: #2a3d55;
  stroke-width: 2;
}
.dot circle {
  fill: #2563eb;
  transition: transform 0.15s linear;
  transform-origin: 60px 60px;
}
.label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e6f3ff;
  text-align: center;
  pointer-events: none;
}
.phase { font-size: 14px; opacity: 0.9; letter-spacing: .1em; }
.timer { font-size: 28px; font-weight: 800; margin-top: 6px; }
</style>
