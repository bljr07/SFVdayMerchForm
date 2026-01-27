<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from './supabase'
import ProductCard from './components/ProductCard.vue'
import Checkout from './views/Checkout.vue'

// State
const products = ref([])
const cart = ref([])
const currentView = ref('shop') // 'shop' or 'checkout'

// Fetch Products
onMounted(async () => {
  const { data } = await supabase.from('products').select('*')
  products.value = data
})

// --- COMPUTED SECTIONS ---
// We filter the main list into specific groups for the UI
const bouquets = computed(() => products.value.filter(p => p.category === 'Bouquets'))
const flowers = computed(() => products.value.filter(p => p.category === 'Flowers'))
// For specific items like Keychains, we filter by Name to give them their own section
const keychains = computed(() => products.value.filter(p => p.name.includes('Key Chain')))
const cardHolders = computed(() => products.value.filter(p => p.name.includes('Card Holder')))
const services = computed(() => products.value.filter(p => p.category === 'Services'))

// --- CART FUNCTIONS ---
const handleAddToCart = (item) => {
  cart.value.push(item)
}

const handleClearCart = () => {
  cart.value = []
  currentView.value = 'shop'
}

const handleUpdateQuantity = (index, change) => {
  if (cart.value[index].quantity === 1 && change === -1) return
  cart.value[index].quantity += change
}

const handleRemoveItem = (index) => {
  if (confirm('Remove this item?')) cart.value.splice(index, 1)
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

  <div class="container py-4">

    <div v-if="currentView === 'shop'">
      
      <div class="text-center mb-5">
        <h1 class="display-5 fw-bold">Valentine's Sales</h1>
        <p class="lead text-muted">Pre-order your gifts and merchandise today.</p>
      </div>

      <!-- Navigation Menu -->
      <div class="sticky-menu bg-body d-flex flex-nowrap overflow-auto gap-2 py-3 mb-4 justify-content-md-center px-2 hide-scrollbar border-bottom">
        <a v-if="bouquets.length > 0" href="#bouquets" class="btn btn-outline-primary rounded-pill text-nowrap">💐 Bouquets</a>
        <a v-if="flowers.length > 0" href="#flowers" class="btn btn-outline-danger rounded-pill text-nowrap">🌹 Single Flowers</a>
        <a v-if="keychains.length > 0" href="#keychains" class="btn btn-outline-success rounded-pill text-nowrap">🎵 CD Key Chains</a>
        <a v-if="cardHolders.length > 0" href="#cards" class="btn btn-outline-info rounded-pill text-nowrap">💳 Card Holders</a>
        <a v-if="services.length > 0" href="#services" class="btn btn-outline-secondary rounded-pill text-nowrap">🎁 Services</a>
      </div>

      <section id="bouquets" v-if="bouquets.length > 0">
        <h3 class="mb-3 text-primary border-bottom pb-2">💐 Bouquets</h3>
        <div class="row">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in bouquets" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="flowers" v-if="flowers.length > 0">
        <h3 class="mb-3 text-danger border-bottom pb-2">🌹 Single Flowers</h3>
        <div class="row">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in flowers" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="keychains" v-if="keychains.length > 0">
        <h3 class="mb-3 text-success border-bottom pb-2">🎵 CD Key Chains</h3>
        <div class="row">
          <div class="col-md-12 col-lg-6 mb-4" v-for="product in keychains" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="cards" v-if="cardHolders.length > 0">
        <h3 class="mb-3 text-info border-bottom pb-2">💳 Card Holders</h3>
        <div class="row">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in cardHolders" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="services" v-if="services.length > 0">
        <h3 class="mb-3 text-secondary border-bottom pb-2">🎁 Services</h3>
        <div class="row">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in services" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

    </div>

    <Checkout 
      v-else 
      :cart="cart" 
      @clear-cart="handleClearCart" 
      @update-quantity="handleUpdateQuantity" 
      @remove-item="handleRemoveItem"
    />

  </div>
</template>

<style>
/* Smooth scrolling for the whole page */
html {
  scroll-behavior: smooth;
}
</style>

