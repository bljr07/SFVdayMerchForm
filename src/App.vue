<script setup>
import { ref, computed, onMounted, watch, reactive, provide } from 'vue'
import { supabase } from './supabase'
import ProductCard from './components/ProductCard.vue'
import Checkout from './views/Checkout.vue'
import OrderSuccess from './views/OrderSuccess.vue'
import BottomToast from './components/BottomToast.vue'

// State
const products = ref([])
const cart = ref([])
const currentView = ref('shop') // 'shop', 'checkout', 'success'
const lastOrder = ref(null)

// Toast State
const toast = reactive({
  visible: false,
  message: '',
  type: 'info'
})

// --- MODAL STATE ---
const showMenuModal = ref(true)

const closeMenuModal = () => {
  showMenuModal.value = false
}

const openMenuModal = () => {
  showMenuModal.value = true
}

const showToast = (message, type = 'info') => {
  toast.message = message
  toast.type = type
  toast.visible = true

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.visible = false
  }, 3000)
}

// Provide showToast to all children
provide('showToast', showToast)

// Watch view changes and scroll to top
watch(currentView, () => {
  window.scrollTo(0, 0)
})

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
  showToast(`Added ${item.name} to cart!`, 'success')
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

const handleOrderPlaced = (order) => {
  lastOrder.value = order
  cart.value = [] // Clear the cart
  currentView.value = 'success'
}
</script>

<template>
  <nav class="navbar mt-2 sticky-top">
    <div class="container d-flex justify-content-between align-items-center">
      <div class="fw-bold fs-1">
        SMU SoundFoundry
      </div>
      <button v-if="currentView !== 'success'"
        class="btn btn-outline-dark position-relative bg-dark-pink text-dark fw-bold"
        @click="currentView = currentView === 'shop' ? 'checkout' : 'shop'">
        {{ currentView === 'shop' ? 'Go to Cart' : 'Back to Shop' }}
        <span v-if="cart.length > 0"
          class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {{ cart.length }}
        </span>
      </button>
    </div>
    <!-- ANNOUNCEMENT BAR -->
    <div class=" bg-danger-subtle text-danger-emphasis overflow-hidden py-2" style="white-space: nowrap;">
      <div class="scrolling-text d-inline-block fw-bold display-6" style="font-size: 1rem;">
        <span>📢 BUY MORE SAVE MORE❗$2 off first $15 spent 😱 ADDITIONAL $2 off every subsequent $10 spent 🥳
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
        <span>📢 BUY MORE SAVE MORE❗$2 off first $15 spent 😱 ADDITIONAL $2 off every subsequent $10 spent 🥳
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>
      </div>
    </div>
  </nav>

  <div class="container py-4">

    <div v-if="currentView === 'shop'">

      <div class="text-center mb-5">
        <h1 class="display-5 fw-bold">Vday Merch Sales 💘</h1>
        <p class="lead text-muted">
          This form is for <b>Flowers</b>, <b>Keychains</b> or <b>Card Holders</b> orders only. (See our menu <a
            href="#" @click.prevent="openMenuModal">
            here</a>!)<br />
          If you’re interested in purchasing <b>Love Wrapped</b> do check out our other order form <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScgwnDnszLwbunhWjT7mjcm7LDEXV9h7EjeKl1LzSqhL7SISQ/viewform?usp=preview">here</a>.<br />
          Order submissions will close on <b>12 February, 11:59pm</b> 💕</p>
      </div>

      <!-- Navigation Menu -->
      <div
        class="sticky-menu sticky-menu-bar d-flex flex-nowrap overflow-x-auto w-100 gap-2 pb-3 pt-4 mb-4 px-2 hide-scrollbar border-bottom justify-content-md-center">
        <a v-if="keychains.length > 0" href="#keychains"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🎵 CD
          Key Chains</a>
        <a v-if="bouquets.length > 0" href="#bouquets"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">💐
          Bouquets</a>
        <a v-if="flowers.length > 0" href="#flowers"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🌹 Single
          Flowers</a>
        <a v-if="cardHolders.length > 0" href="#cards"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">💳 Card
          Holders</a>
        <a v-if="services.length > 0" href="#services"
          class="btn btn-outline-danger rounded-pill text-nowrap bg-dark-pink text-dark fw-medium">🎁
          Services</a>
      </div>

      <section id="keychains" v-if="keychains.length > 0">
        <h3 class="mb-3 text-dark border-bottom pb-2 fw-bold">🎵 CD Key Chains</h3>
        <div class="row justify-content-center">
          <div class="col-md-12 col-lg-6 mb-4" v-for="product in keychains" :key="product.id">
            <ProductCard :product="product" @add-to-cart="handleAddToCart" />
          </div>
        </div>
      </section>

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

    <Checkout v-else-if="currentView === 'checkout'" :cart="cart" @clear-cart="handleClearCart"
      @update-quantity="handleUpdateQuantity" @remove-item="handleRemoveItem" @order-placed="handleOrderPlaced" />

    <OrderSuccess v-else-if="currentView === 'success'" :order="lastOrder" @back-to-shop="currentView = 'shop'" />

    <!-- Global Toast -->
    <BottomToast :visible="toast.visible" :message="toast.message" :type="toast.type" @close="toast.visible = false" />

    <!-- MERCH MENU MODAL -->
    <div v-if="showMenuModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)"
      @click.self="closeMenuModal">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content position-relative bg-transparent border-0">
          <div class="modal-body p-0 text-center">
            <div class="d-inline-block position-relative">
              <button type="button"
                class="btn-close position-absolute top-0 end-0 m-4 z-3 bg-white p-2 rounded-circle shadow"
                @click="closeMenuModal"></button>
              <img src="/Merch Menu.png" class="img-fluid rounded shadow-lg" style="max-height: 90vh; width: auto;"
                alt="Merch Menu">
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Smooth scrolling for the whole page */
html {
  scroll-behavior: smooth;
}

/* MARQUEE ANIMATION */
.scrolling-text {
  animation: scroll-left 20s linear infinite;
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

/* STICKY MENU RESPONSIVE TOP */
.sticky-menu-bar {
  top: 85px;
}

/* Medium screens */
@media (min-width: 768px) {
  .sticky-menu-bar {
    top: 90px;
  }
}

/* Large screens */
@media (min-width: 992px) {
  .sticky-menu-bar {
    top: 100px;
  }
}
</style>
