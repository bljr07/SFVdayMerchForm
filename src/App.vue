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
  <nav class="navbar mt-2 sticky-top">
    <div class="container d-flex justify-content-between align-items-center">
      <div class="fw-bold fs-1">
        SMU SoundFoundry
      </div>
      <button class="btn btn-outline-dark position-relative bg-dark-pink text-dark fw-bold"
        @click="currentView = currentView === 'shop' ? 'checkout' : 'shop'">
        {{ currentView === 'shop' ? 'Go to Cart' : 'Back to Shop' }}
        <span v-if="cart.length > 0"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {{ cart.length }}
        </span>
      </button>
    </div>
  </nav>

  <div class="container py-4">

    <div v-if="currentView === 'shop'">

      <div class="text-center mb-5">
        <h1 class="display-5 fw-bold">Vday Merch Sales 💘</h1>
        <p class="lead text-muted">
          This form is for <b>Flowers</b>, <b>Keychains</b> or <b>Card Holders</b> orders only.<br />
          If you’re interested in purchasing <b>Love Wrapped</b> do check out our other order form <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScgwnDnszLwbunhWjT7mjcm7LDEXV9h7EjeKl1LzSqhL7SISQ/viewform?usp=preview">here</a>.<br />
          Order submissions will close on <b>12 February, 11:59pm</b> 💕</p>
      </div>

      <!-- Navigation Menu -->
      <div
        class="sticky-menu d-flex flex-nowrap overflow-x-auto w-100 gap-2 py-3 mb-4 px-2 hide-scrollbar border-bottom justify-content-md-center">
        <a v-if="bouquets.length > 0" href="#bouquets"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">💐
          Bouquets</a>
        <a v-if="flowers.length > 0" href="#flowers"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🌹 Single
          Flowers</a>
        <a v-if="keychains.length > 0" href="#keychains"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🎵 CD
          Key Chains</a>
        <a v-if="cardHolders.length > 0" href="#cards"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">💳 Card
          Holders</a>
        <a v-if="services.length > 0" href="#services"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🎁
          Services</a>
      </div>

      <section id="bouquets" v-if="bouquets.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">💐 Bouquets</h3>
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in bouquets" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="flowers" v-if="flowers.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">🌹 Single Flowers</h3>
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in flowers" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="keychains" v-if="keychains.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">🎵 CD Key Chains</h3>
        <div class="row justify-content-center">
          <div class="col-md-12 col-lg-6 mb-4" v-for="product in keychains" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="cards" v-if="cardHolders.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">💳 Card Holders</h3>
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in cardHolders" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

      <section id="services" v-if="services.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">🎁 Services</h3>
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-4 mb-4" v-for="product in services" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

    </div>

    <Checkout v-else :cart="cart" @clear-cart="handleClearCart" @update-quantity="handleUpdateQuantity"
      @remove-item="handleRemoveItem" />

  </div>
</template>

<style>
/* Smooth scrolling for the whole page */
html {
  scroll-behavior: smooth;
}
</style>
