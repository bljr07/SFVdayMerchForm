<script setup>
import { ref, reactive, computed, watch, inject } from 'vue'
import { supabase } from '../supabase'

const props = defineProps(['product'])
const emit = defineEmits(['add-to-cart'])
const showToast = inject('showToast') // Inject the toast method

const isUploading = ref(false)
const showInstructionModal = ref(false)

const openInstructionModal = () => {
  showInstructionModal.value = true
}

const closeInstructionModal = () => {
  showInstructionModal.value = false
}

// --- DATA: BOUQUET OPTIONS ---
const flowerOptions = {
  'Rose': ['Pink', 'Red'],
  'Gerbera': ['White', 'Pink'],
  // 'Calla Lily': ['Black', 'White'],
  'Calla Lily': ['White']
}

// --- COMPUTED: DETECT BOUQUET SIZE ---
const bouquetSize = computed(() => {
  if (props.product.category !== 'Bouquets') return 0
  if (props.product.name.includes('3')) return 3
  if (props.product.name.includes('5')) return 5
  return 1 // Fallback
})

// --- COMPUTED: FINAL PRICE ---
const finalPrice = computed(() => {
  let price = props.product.price

  if (props.product.category === 'Bouquets') {
    if (form.flower_type === 'Calla Lily') {
      price += 5 * bouquetSize.value
    }
    // New Feature: Filler Flowers
    if (form.filler_flowers === 'Yes') {
      if (bouquetSize.value === 3) price += 5
      if (bouquetSize.value === 5) price += 8
    }
  }
  return price
})

// --- COMPUTED: PILL PRICE ---
const priceDisplay = computed(() => {
  let extras = []

  if (props.product.category === 'Bouquets') {
    if (form.flower_type === 'Calla Lily') {
      if (bouquetSize.value === 3) extras.push('+ $15')
      if (bouquetSize.value === 5) extras.push('+ $25')
    }

    if (form.filler_flowers === 'Yes') {
      if (bouquetSize.value === 3) extras.push('+ $5')
      if (bouquetSize.value === 5) extras.push('+ $8')
    }
  }

  if (extras.length > 0) {
    return `$${props.product.price} ${extras.join(' ')}`
  }
  return `$${finalPrice.value}`
})

// --- COMPUTED: CAROUSEL IMAGES ---
const carouselImages = computed(() => {
  const images = []

  // 1. BOUQUETS: Show specific set image + all flower types
  if (props.product.category === 'Bouquets') {
    if (bouquetSize.value === 3) images.push('/Bouquet Set of 3.png')
    if (bouquetSize.value === 5) images.push('/Bouquet Set of 5.png')

    // Add logic to show individual flower types as valid options
    images.push('/Bouquet Flowers.png')
    images.push('/Bouquet Filler Flowers.png')
    images.push('/Wrapping Paper.png')
  }

  // 2. INDIVIDUAL FLOWERS
  else if (props.product.category === 'Flowers') {
    if (props.product.name.includes('Rose')) images.push('/Rose.png')
    if (props.product.name.includes('Gerbera')) images.push('/Gerbera.png')
    if (props.product.name.includes('Calla')) images.push('/Calla Lily.png')
  }

  // 3. OTHERS
  else if (props.product.name === 'CD Key Chain') {
    images.push('/CD Keychain.png')
  } else if (props.product.name === 'Card Holder') {
    images.push('/Cardholder.png')
  } else if (props.product.name === 'Wrapping Service') {
    images.push('/Wrapping Paper.png')
  }

  // Fallback if no image found (though strictly shouldn't happen with current data)
  if (images.length === 0) {
    // Optional: Add a placeholder or just leave empty
  }

  return images
})

// --- FORM STATE ---
const form = reactive({
  quantity: 1,
  // CD Key Chain
  bg_color: '',
  album_name: '',
  artist: '',
  caption: '',
  cover_img: '',
  pic1_img: '',
  pic2_img: '',
  // Bouquet
  flower_type: '',
  bouquet_colors: [],
  filler_flowers: '',
  wrapping: '',
  // Card Holder
  variation: '',
  // Flowers
  single_flower_color: ''
})

// --- WATCHERS ---
// If user switches Flower Type, reset ALL color selections
watch(() => form.flower_type, () => {
  if (props.product.category === 'Bouquets') {
    form.bouquet_colors = new Array(bouquetSize.value).fill('')
  }
})

// Initialize bouquet_colors array based on size when component loads
if (props.product.category === 'Bouquets') {
  form.bouquet_colors = new Array(bouquetSize.value).fill('')
}

// --- UPLOAD LOGIC ---
const uploadImage = async (event, fieldName) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast('Invalid file type. Please upload an image (JPG, PNG, etc).', 'error')
    event.target.value = ''
    return
  }

  const maxSizeInBytes = 50 * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    showToast('File is too large! Please upload an image smaller than 50MB.', 'error')
    event.target.value = ''
    return
  }

  isUploading.value = true
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '-')}`

  try {
    const { error } = await supabase.storage.from('order-uploads').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('order-uploads').getPublicUrl(fileName)
    form[fieldName] = data.publicUrl
    showToast('Image uploaded successfully!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
    event.target.value = ''
  } finally {
    isUploading.value = false
  }
}

// --- ADD TO CART ---
const addToCart = () => {
  let errorMessage = ''

  // === VALIDATION RULES ===
  if (props.product.category === 'Bouquets') {
    if (!form.flower_type) {
      errorMessage = 'Please select a Flower Type.'
    } else if (!form.filler_flowers) {
      errorMessage = 'Please select Yes/No for Filler Flowers.'
    } else if (!form.wrapping) {
      errorMessage = 'Please select a Wrapping Paper.'
    } else {
      // Check if ANY of the required flowers are missing a color
      for (let i = 0; i < bouquetSize.value; i++) {
        if (!form.bouquet_colors[i]) {
          errorMessage = `Please select a color for Flower #${i + 1}.`
          break
        }
      }
    }

  } else if (props.product.category === 'Flowers') {
    if (!form.single_flower_color) errorMessage = 'Please select a Color.'

  } else if (props.product.name === 'Card Holder') {
    if (!form.variation) errorMessage = 'Please select a Variation.'

  } else if (props.product.name === 'Wrapping Service') {
    if (!form.wrapping) errorMessage = 'Please select a Paper Style.'

  } else if (props.product.name === 'CD Key Chain') {
    if (!form.bg_color) errorMessage = 'Please select a Background Color.'
    else if (!form.album_name) errorMessage = 'Please enter Album Name.'
    else if (!form.cover_img || !form.pic1_img || !form.pic2_img) errorMessage = 'Please upload all 3 images.'
  }

  // === STOP IF INVALID ===
  if (errorMessage) {
    showToast(errorMessage, 'error')
    return
  }

  // === PREPARE DATA ===
  let finalOptions = {}

  if (props.product.name === 'CD Key Chain') {
    finalOptions = {
      bg: form.bg_color,
      album: form.album_name,
      artist: form.artist,
      caption: form.caption,
      cover: form.cover_img,
      pic1: form.pic1_img,
      pic2: form.pic2_img
    }
  } else if (props.product.category === 'Bouquets') {
    // Construct the bouquet options
    finalOptions = {
      flower_type: form.flower_type,
      wrapping: form.wrapping,
      filler_flowers: form.filler_flowers
    }
    // Add each flower color individually (flower_1, flower_2, etc.)
    form.bouquet_colors.forEach((color, index) => {
      finalOptions[`flower_${index + 1}`] = color
    })

  } else if (props.product.category === 'Flowers') {
    finalOptions = { color: form.single_flower_color || 'Standard' }
  } else if (props.product.name === 'Card Holder') {
    finalOptions = { variation: form.variation }
  } else if (props.product.name === 'Wrapping Service') {
    finalOptions = { style: form.wrapping }
  }

  // 3. Emit event
  emit('add-to-cart', {
    id: props.product.id,
    name: props.product.name,
    price: finalPrice.value,
    quantity: form.quantity,
    options: finalOptions
  })
}
</script>

<template>
  <div class="card h-100 shadow-sm border-0 w-100 overflow-hidden">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title fw-bold">{{ product.name }} {{ product.name === "CD Key Chain" ? '(Collection after 12 Feb)' : '' }}</h5>
        <span class="badge bg-dark-pink text-dark rounded-pill">{{ priceDisplay }}</span>
      </div>

      <!-- CAROUSEL START -->
      <div v-if="carouselImages.length > 0" :id="'carousel-' + product.id" class="carousel slide mb-3"
        data-bs-ride="carousel">
        <div class="carousel-inner rounded">
          <div v-for="(img, index) in carouselImages" :key="index" :class="['carousel-item', { active: index === 0 }]">
            <img :src="img" class="d-block w-100" style="aspect-ratio: 1414/2000; object-fit: contain;"
              :alt="product.name">
          </div>
        </div>
        <button v-if="carouselImages.length > 1" class="carousel-control-prev" type="button"
          :data-bs-target="'#carousel-' + product.id" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button v-if="carouselImages.length > 1" class="carousel-control-next" type="button"
          :data-bs-target="'#carousel-' + product.id" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
      </div>
      <!-- CAROUSEL END -->

      <div class="container m-0 p-0 mb-3">
        <p class="card-text text-muted small fst-italic d-flex align-items-center justify-content-between">
          <span>
            {{ product.description }}<br />
            {{ product.category === 'Bouquets' ? 'Filler flowers will be choosen by team based on flower selection' :
              '' }}
            {{ product.category === 'Services' ? `Purchase to wrap flower stalks. Purchase multiple if you want each
            stalk to be wrapped individually.` : '' }}
          </span>
          <button v-if="product.name === 'CD Key Chain'" class="btn ms-1 p-1 pe-2 bg-transparent fw-bold"
            @click="openInstructionModal" style="color: #DE4D56; border-color: #DE4D56; white-space: nowrap;">
            ❗Instructions
          </button>
        </p>
      </div>

      <div v-if="product.category === 'Bouquets'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">1. Choose Flower Type</label>
        <select v-model="form.flower_type" class="form-select form-select-sm mb-3">
          <option value="" disabled>Select Type...</option>
          <option value="Rose">Rose</option>
          <option value="Gerbera">Gerbera</option>
          <option value="Calla Lily">Calla Lily (+$5 per stalk)</option>
        </select>

        <div v-if="form.flower_type">
          <label class="form-label small fw-bold">2. Choose Colors</label>
          <div v-for="n in bouquetSize" :key="n" class="mb-2">
            <span class="small text-muted d-block mb-1">Flower #{{ n }}</span>
            <select v-model="form.bouquet_colors[n - 1]" class="form-select form-select-sm">
              <option value="" disabled>Select Color...</option>
              <option v-for="color in flowerOptions[form.flower_type]" :key="color" :value="color">
                {{ color }}
              </option>
            </select>
          </div>
        </div>
        <div v-else class="mb-3">
          <small class="text-danger fst-italic">Please select a flower type to see color options.</small>
        </div>

        <label class="form-label small fw-bold mt-2">3. Filler Flowers?</label>
        <select v-model="form.filler_flowers" class="form-select form-select-sm">
          <option value="" disabled>Select Option...</option>
          <option v-if="product.name.includes('3')" value="Yes">Yes (+$5)</option>
          <option v-if="product.name.includes('5')" value="Yes">Yes (+$8)</option>
          <option value="No">No</option>
        </select>

        <label class="form-label small fw-bold mt-2">4. Paper Style</label>
        <select v-model="form.wrapping" class="form-select form-select-sm">
          <option value="" disabled>Select Paper...</option>
          <option>Brown Paper</option>
          <option>Lace Paper</option>
        </select>
      </div>

      <div v-if="product.category === 'Flowers'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">Select Color</label>
        <select v-model="form.single_flower_color" class="form-select form-select-sm">
          <option value="" disabled>Select Color...</option>
          <option v-if="product.name.includes('Rose')">Red</option>
          <option v-if="product.name.includes('Rose')">Pink</option>

          <option v-if="product.name.includes('Gerbera')">White</option>
          <option v-if="product.name.includes('Gerbera')">Pink</option>

          <!-- <option v-if="product.name.includes('Calla')">Black</option> -->
          <option v-if="product.name.includes('Calla')">White</option>

          <option v-if="product.name.includes('Baby')">White</option>
          <option v-if="product.name.includes('Baby')">Blue</option>
        </select>
      </div>

      <div v-if="product.name === 'Card Holder'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">Select Variation</label>
        <select v-model="form.variation" class="form-select form-select-sm">
          <option value="" disabled>Select Variation...</option>
          <option>Duck</option>
          <option>Dinosaur</option>
          <option>Capybara</option>
          <option>Shark</option>
        </select>
      </div>

      <div v-if="product.name === 'Wrapping Service'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">Select Wrapping</label>
        <select v-model="form.wrapping" class="form-select form-select-sm">
          <option value="" disabled>Select Paper...</option>
          <option>Brown Paper</option>
          <option>Lace Paper</option>
        </select>
      </div>

      <div v-if="product.name === 'CD Key Chain'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">1. Select Background Color</label>
        <select v-model="form.bg_color" class="form-select form-select-sm mb-2">
          <option value="" disabled>Select Color...</option>
          <option value="Black">Black</option>
          <option value="Beige">Beige</option>
          <option value="Red">Red</option>
        </select>

        <label class="form-label small fw-bold">2. Upload image (Front Cover/ Album Cover)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'cover_img')"
          accept="image/*" />
        <label class="form-label small fw-bold">3. Upload image (Inside Keychain)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'pic1_img')"
          accept="image/*" />
        <label class="form-label small fw-bold">4. Upload image (Back Cover)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'pic2_img')"
          accept="image/*" />
        <label class="form-label small fw-bold">5. Other details</label>
        <input v-model="form.album_name" class="form-control form-control-sm mb-2" placeholder="Album Name" />
        <input v-model="form.artist" class="form-control form-control-sm mb-2" placeholder="Artist Name" />
        <textarea v-model="form.caption" class="form-control form-control-sm" placeholder="Caption (Max 50 characters)"
          maxlength="50"></textarea>
      </div>

      <button class="btn bg-dark-pink border-dark w-100" @click="addToCart" :disabled="isUploading">
        {{ isUploading ? 'Uploading...' : 'Add to Cart' }}
      </button>
    </div>
  </div>

  <!-- INSTRUCTION MODAL -->
  <div v-if="showInstructionModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)"
    @click="closeInstructionModal">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content position-relative bg-transparent border-0">
        <div class="modal-body p-0 text-center">
          <div class="d-inline-block position-relative" @click.stop>
            <button type="button"
              class="btn-close position-absolute top-0 end-0 m-4 z-3 bg-white p-2 rounded-circle shadow"
              @click="closeInstructionModal"></button>
            <img src="/CD Keychain Instructions.png" class="img-fluid rounded shadow-lg"
              style="max-height: 90vh; width: auto;" alt="Instructions">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>