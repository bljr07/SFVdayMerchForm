<script setup>
defineProps({
  visible: Boolean,
  message: String,
  type: {
    type: String,
    default: 'info' // 'info', 'success', 'error'
  }
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="visible" class="toast-container position-fixed bottom-0 start-50 translates-middle-x p-3" style="z-index: 2000; transform: translateX(-50%);">
      <div class="toast show align-items-center border-0 shadow-lg" :class="{
        'text-bg-danger': type === 'error',
        'text-bg-success': type === 'success',
        'text-bg-dark': type === 'info'
      }" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body fs-6 fw-medium">
            {{ message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="$emit('close')" aria-label="Close"></button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%) !important; 
  opacity: 0;
}
</style>
