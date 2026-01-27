<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { supabase } from '../supabase'

const props = defineProps(['product'])
const emit = defineEmits(['add-to-cart'])
const isUploading = ref(false)

// --- DATA: BOUQUET OPTIONS ---
// This map defines valid colors for each flower type
const flowerOptions = {
  'Rose': ['White', 'Pink', 'Red'],
  'Gerbera': ['White', 'Pink']
}

// --- FORM STATE ---
const form = reactive({
  quantity: 1,
  // CD Key Chain
  bg_color: '', // Changed from default to empty
  album_name: '',
  artist: '',
  caption: '',
  cover_img: '', 
  pic1_img: '',
  pic2_img: '',
  // Bouquet
  flower_type: '', 
  flower_color: '',
  wrapping: '',
  // Card Holder
  character: '',
  // Flowers
  single_flower_color: ''
})

// --- WATCHERS ---
// If user switches from Rose to Gerbera, reset the color selection
watch(() => form.flower_type, (newType) => {
  if (props.product.category === 'Bouquets') {
    form.flower_color = '' // Reset color if type changes
  }
})

// --- UPLOAD LOGIC (Same as before) ---
const uploadImage = async (event, fieldName) => {
  const file = event.target.files[0]
  if (!file) return

  // === NEW VALIDATION CHECKS ===
  
  // 1. Check File Type (Must be an image)
  if (!file.type.startsWith('image/')) {
    alert('Invalid file type. Please upload an image (JPG, PNG, etc).')
    event.target.value = '' // Clear the input so they can try again
    return
  }

  // 2. Check File Size (50MB Limit)
  // Math: 50 MB * 1024 KB * 1024 Bytes
  const maxSizeInBytes = 50 * 1024 * 1024 
  
  if (file.size > maxSizeInBytes) {
    alert('File is too large! Please upload an image smaller than 50MB.')
    event.target.value = '' // Clear the input
    return
  }

  // === END VALIDATION ===

  isUploading.value = true
  const fileName = `${Date.now()}_${file.name.replace(/\s/g, '-')}`
  
  try {
    const { error } = await supabase.storage.from('order-uploads').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('order-uploads').getPublicUrl(fileName)
    form[fieldName] = data.publicUrl
  } catch (err) {
    alert(err.message)
    event.target.value = '' // Reset input on error
  } finally {
    isUploading.value = false
  }
}

// --- ADD TO CART ---
const addToCart = () => {
  let isValid = true
  let errorMessage = ''

  // === VALIDATION RULES ===
  if (props.product.category === 'Bouquets') {
    if (!form.flower_type) errorMessage = 'Please select a Flower Type.'
    else if (!form.flower_color) errorMessage = 'Please select a Flower Color.'
    else if (!form.wrapping) errorMessage = 'Please select a Wrapping Paper.'
  
  } else if (props.product.category === 'Flowers') {
    if (!form.single_flower_color) errorMessage = 'Please select a Color.'

  } else if (props.product.name === 'Card Holder') {
    if (!form.character) errorMessage = 'Please select a Variation.'

  } else if (props.product.name === 'Wrapping Service') {
    if (!form.wrapping) errorMessage = 'Please select a Paper Style.'

  } else if (props.product.name === 'CD Key Chain') {
    if (!form.bg_color) errorMessage = 'Please select a Background Color.'
    else if (!form.album_name) errorMessage = 'Please enter Album Name.'
    else if (!form.cover_img || !form.pic1_img || !form.pic2_img) errorMessage = 'Please upload all 3 images.'
  }

  // === STOP IF INVALID ===
  if (errorMessage) {
    alert(errorMessage)
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
    finalOptions = {
      flower_type: form.flower_type,
      flower_color: form.flower_color,
      wrapping: form.wrapping
    }
  } else if (props.product.category === 'Flowers') {
    // For single flowers, just save the color
    finalOptions = { color: form.single_flower_color || 'Standard' }
  } else if (props.product.name === 'Card Holder') {
    finalOptions = { character: form.character }
  } else if (props.product.name === 'Wrapping Service') {
    finalOptions = { style: form.wrapping }
  }

  // 3. Emit event
  emit('add-to-cart', {
    id: props.product.id,
    name: props.product.name,
    price: props.product.price,
    quantity: form.quantity,
    options: finalOptions
  })

  alert('Added to cart!')
  
  // Optional: Reset form after adding
  // form.flower_color = ''
  // ...
}


</script>

<template>
  <div class="card h-100 shadow-sm border-0">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title fw-bold">{{ product.name }}</h5>
        <span class="badge bg-primary rounded-pill">${{ product.price }}</span>
      </div>
      <p class="card-text text-muted small mb-3">{{ product.description }}</p>

      <div v-if="product.category === 'Bouquets'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">1. Choose Flower</label>
        <select v-model="form.flower_type" class="form-select form-select-sm mb-2">
          <option value="Rose">Rose</option>
          <option value="Gerbera">Gerbera</option>
        </select>

        <label class="form-label small fw-bold">2. Choose Color</label>
        <select v-model="form.flower_color" class="form-select form-select-sm mb-2">
          <option v-for="color in flowerOptions[form.flower_type]" :key="color" :value="color">
            {{ color }}
          </option>
        </select>

        <label class="form-label small fw-bold">3. Paper Style</label>
        <select v-model="form.wrapping" class="form-select form-select-sm">
          <option>Brown Paper</option>
          <option>Lace Paper</option>
        </select>
      </div>

      <div v-if="product.category === 'Flowers'" class="mb-3">
        <label class="form-label small fw-bold">Select Color</label>
        <select v-model="form.single_flower_color" class="form-select form-select-sm">
           <option v-if="product.name.includes('Rose')">Red</option>
           <option v-if="product.name.includes('Rose')">White</option>
           <option v-if="product.name.includes('Rose')">Pink</option>
           
           <option v-if="product.name.includes('Gerbera')">White</option>
           <option v-if="product.name.includes('Gerbera')">Pink</option>

           <option v-if="product.name.includes('Calla')">Black</option>
           <option v-if="product.name.includes('Calla')">White</option>

           <option v-if="product.name.includes('Baby')">White</option>
           <option v-if="product.name.includes('Baby')">Blue</option>
        </select>
      </div>

      <div v-if="product.name === 'Card Holder'" class="mb-3">
        <label class="form-label small fw-bold">Select Variation</label>
        <select v-model="form.character" class="form-select form-select-sm">
          <option>Duck</option>
          <option>Dinosaur</option>
          <option>Capybara</option>
          <option>Shark</option>
        </select>
      </div>

      <div v-if="product.name === 'Wrapping Service'" class="mb-3">
        <label class="form-label small fw-bold">Select Wrapping</label>
         <select v-model="form.wrapping" class="form-select form-select-sm">
          <option>Brown Paper</option>
          <option>Lace Paper</option>
        </select>
      </div>

      <div v-if="product.name === 'CD Key Chain'" class="bg-light p-3 rounded mb-3">
        <label class="form-label small fw-bold">1. Select Background Color</label>
        <select v-model="form.bg_color" class="form-select form-select-sm mb-2">
          <option value="White">White</option>
          <option value="Black">Black</option>
          <option value="Beige">Beige</option>
          <option value="Red">Red</option>
        </select>

        <label class="form-label small fw-bold">2. Upload image (Front Cover)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'cover_img')" accept="image/*" />
        <label class="form-label small fw-bold">3. Upload image (Inside Keychain)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'pic1_img')" accept="image/*" />
        <label class="form-label small fw-bold">4. Upload image (Back Cover)</label>
        <input type="file" class="form-control form-control-sm mb-2" @change="uploadImage($event, 'pic2_img')" accept="image/*" />
        <label class="form-label small fw-bold">5. Other details</label>
        <input v-model="form.album_name" class="form-control form-control-sm mb-2" placeholder="Album Name" />
        <input v-model="form.artist" class="form-control form-control-sm mb-2" placeholder="Artist Name" />
        <textarea v-model="form.caption" class="form-control form-control-sm" placeholder="Caption (Max 50 characters)" maxlength="50"></textarea>
      </div>

      <button 
        class="btn btn-dark w-100" 
        @click="addToCart"
        :disabled="isUploading"
      >
        {{ isUploading ? 'Uploading...' : 'Add to Cart' }}
      </button>
    </div>
  </div>
</template>