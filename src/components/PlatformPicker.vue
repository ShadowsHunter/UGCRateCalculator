<script setup lang="ts">
// 输入 ① Platform：3 按钮单选（radio sr-only + label，D02 §3.1）。defineModel 单 model 组件。
import { PLATFORM_LABEL, PLATFORM_OPTIONS } from '../copy'
import type { Platform } from '../types'

const model = defineModel<Platform>({ required: true })
</script>

<template>
  <fieldset>
    <legend class="mb-2 text-sm font-medium text-slate-600">{{ PLATFORM_LABEL }}</legend>
    <div class="grid grid-cols-3 gap-2 max-[349px]:grid-cols-1">
      <label
        v-for="opt in PLATFORM_OPTIONS"
        :key="opt.value"
        class="relative flex min-h-11 cursor-pointer items-center justify-center rounded-lg border p-2 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600 has-[:focus-visible]:ring-offset-2"
        :class="model === opt.value
          ? 'border-indigo-600 bg-indigo-600 font-semibold text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50'"
      >
        <input v-model="model" type="radio" :value="opt.value" name="platform" class="sr-only" />
        {{ opt.label }}
      </label>
    </div>
  </fieldset>
</template>