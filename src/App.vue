<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'
import ProductCard from './components/ProductCard.vue'
import Checkout from './views/Checkout.vue' // Import the file we just made

// State
const products = ref([])
const cart = ref([])
const currentView = ref('shop') // 'shop' or 'checkout'

// Fetch Products on Load
onMounted(async () => {
  const { data } = await supabase.from('products').select('*').order('category')
  products.value = data
})

// Add item to local cart variable
const handleAddToCart = (item) => {
  cart.value.push(item)
}

// Clear cart after successful order
const handleClearCart = () => {
  cart.value = []
  currentView.value = 'shop' // Go back to shop
}

const handleUpdateQuantity = (index, change) => {
  // If trying to decrease when quantity is 1, do nothing (or you could prompt to delete)
  if (cart.value[index].quantity === 1 && change === -1) return
  
  cart.value[index].quantity += change
}

// 2. Handle Remove Item
const handleRemoveItem = (index) => {
  if (confirm('Are you sure you want to remove this item?')) {
    cart.value.splice(index, 1)
  }
}
</script>

<template>
  <nav class="navbar navbar-dark bg-dark mb-4 sticky-top">
    <div class="container">
      <span class="navbar-brand mb-0 h1">SOUNDFOUNDRY VDAY MERCH SALES</span>
      <button class="btn btn-outline-light position-relative" @click="currentView = currentView === 'shop' ? 'checkout' : 'shop'">
        {{ currentView === 'shop' ? 'Go to Checkout' : 'Back to Shop' }}
        <span v-if="cart.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {{ cart.length }}
        </span>
      </button>
    </div>
  </nav>

  <div v-if="currentView === 'shop'" class="container">
    <div class="row">
      <div class="col-md-6 col-lg-4 mb-4" v-for="product in products" :key="product.id">
        <ProductCard :product="product" @add-to-cart="handleAddToCart" />
      </div>
    </div>
  </div>

  <Checkout 
    v-else 
    :cart="cart" 
    @clear-cart="handleClearCart"
    @update-quantity="handleUpdateQuantity"
    @remove-item="handleRemoveItem"
  />
</template>