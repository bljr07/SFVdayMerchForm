<script setup>
defineProps(['order'])
defineEmits(['back-to-shop'])
</script>

<template>
  <div class="container py-5 text-center">
    <div class="card p-5 border-0 shadow-sm mx-auto" style="max-width: 600px;">
      <div class="mb-4 text-success display-1">
        ✅
      </div>
      <h2 class="mb-3 fw-bold">Order Confirmed!</h2>
      <p class="text-muted mb-4">
        Thank you, <b>{{ order.customer_name }}</b>! Your order has been placed successfully.
      </p>

      <div class="bg-light p-3 rounded mb-4 text-start">
        <p class="mb-1"><strong>Order ID:</strong> <span class="font-monospace text-primary">{{ order.id }}</span></p>
        <p class="mb-1"><strong>Total Amount Paid:</strong> ${{ order.total_amount }}</p>
        <p class="mb-0"><strong>Payment Proof:</strong> <a :href="order.payment_proof_url" target="_blank">View</a></p>
      </div>

      <div class="alert alert-info small">
        Please take a screenshot of this page and save your Order ID for reference.
      </div>

      <button @click="$emit('back-to-shop')" class="btn btn-outline-dark mt-3 bg-dark-pink text-dark fw-bold">
        Back to Shop
      </button>
    </div>
  </div>
</template>
