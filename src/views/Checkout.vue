<script setup>
import { ref, reactive, computed } from 'vue'
import { supabase } from '../supabase'

const props = defineProps(['cart'])
const emit = defineEmits(['clear-cart', 'update-quantity', 'remove-item', 'order-placed'])

const isSubmitting = ref(false)
const isUploading = ref(false) // State for the receipt upload

const customer = reactive({
  name: '',
  email: '',
  tele: '',
  instagram: '', // <--- 1. NEW FIELD
  note: '',
  payment_proof: '', // <-- NEW: Stores the uploaded URL
  pdpa_consent: false // <--- PDPA Consent
})

const subtotal = computed(() => {
  return props.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const discountAmount = computed(() => {
  const sub = subtotal.value
  if (sub < 15) return 0
  
  // First $15 spent = $2 discount
  let discount = 2
  
  // Remaining amount after the first $15
  const remaining = sub - 15
  
  // For every subsequent $10 spent, add $2 discount
  if (remaining >= 10) {
    discount += Math.floor(remaining / 10) * 2
  }
  
  return discount
})

const finalTotal = computed(() => {
  return Math.max(0, subtotal.value - discountAmount.value)
})

const uploadProof = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // === NEW VALIDATION CHECKS ===

  // 1. Check File Type
  if (!file.type.startsWith('image/')) {
    alert('Invalid file type. Please upload an image of your receipt.')
    event.target.value = ''
    return
  }

  // 2. Check File Size (< 50MB)
  const maxSizeInBytes = 50 * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    alert('File is too large! Please upload an image smaller than 50MB.')
    event.target.value = ''
    return
  }

  // === END VALIDATION ===

  isUploading.value = true
  const fileName = `${Date.now()}_proof_${file.name.replace(/\s/g, '-')}`

  try {
    const { error } = await supabase.storage.from('order-uploads').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('order-uploads').getPublicUrl(fileName)
    customer.payment_proof = data.publicUrl

  } catch (error) {
    alert('Error uploading proof: ' + error.message)
    event.target.value = ''
  } finally {
    isUploading.value = false
  }
}

// Helper to format option keys nicely
const formatKey = (key) => {
  const overrides = {
    'bg': 'Background Color',
    'album': 'Album Name',
    'artist': 'Artist',
    'caption': 'Caption',
    'cover': 'Cover Image',
    'pic1': 'Picture 1',
    'pic2': 'Picture 2',
    'tele': 'Telegram/Phone'
  }
  if (overrides[key]) return overrides[key]

  // Convert snake_case to Title Case (e.g. flower_type -> Flower Type)
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// --- Submit Order ---
const submitOrder = async () => {
  if (props.cart.length === 0) return alert('Your cart is empty!')

  // Validation checks
  if (!customer.name || !customer.tele || !customer.email) return alert('Please fill in your contact details.')
  if (!customer.instagram) return alert('Please enter your Instagram handle for the giveaway.')
  if (!customer.payment_proof) return alert('Please upload the payment proof before submitting.')
  if (!customer.pdpa_consent) return alert('Please acknowledge the PDPA clause.')

  isSubmitting.value = true

  try {
    // 1. Generate the ID manually in JavaScript
    const newOrderId = crypto.randomUUID()

    // 2. Insert Order (With the ID we just created)
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: newOrderId, // <--- Send the ID here
        customer_name: customer.name,
        customer_email: customer.email,
        customer_tele: customer.tele,
        instagram_handle: customer.instagram,
        total_amount: finalTotal.value, 
        status: 'paid',
        special_note: customer.note,
        payment_proof_url: customer.payment_proof
      })

    if (orderError) throw orderError

    // 3. Create Order Items (Using the same newOrderId)
    const orderItems = props.cart.map(item => ({
      order_id: newOrderId,
      product_id: item.id,
      quantity: item.quantity,
      options: item.options
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) throw itemsError

    // Construct the order object to pass back
    const orderDetails = {
      id: newOrderId,
      customer_name: customer.name,
      total_amount: finalTotal.value, 
      payment_proof_url: customer.payment_proof
    }
    
    emit('order-placed', orderDetails)

    // Reset form
    Object.keys(customer).forEach(key => customer[key] = '')
    
    // Reset pdpa
    customer.pdpa_consent = false

  } catch (error) {
    console.error(error)
    alert('Error placing order: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <h2 class="mb-4">Checkout</h2>
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header bg-white fw-bold">Your Order</div>
          <ul class="list-group list-group-flush">
            <li v-for="(item, index) in cart" :key="index" class="list-group-item">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong class="d-block mb-1">{{ item.name }}</strong>
                  <div v-for="(val, k) in item.options" :key="k" class="text-muted small mb-1">
                    <span class="fst-italic text-dark">{{ formatKey(k) }}: </span>
                    <span v-if="String(val).startsWith('http')" class="fst-italic">
                      <a :href="val" target="_blank" class="text-decoration-underline">View</a>
                    </span>
                    <span v-else-if="String(val).includes('Calla Lily')" class="fst-italic">{{ val }} (+$5)</span>
                    <span v-else class="fst-italic">{{ val }}</span>
                  </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                  <span class="fw-bold fs-5 mb-2">${{ item.price * item.quantity }}</span>

                  <!-- Quantity Controls -->
                  <div class="d-flex align-items-center gap-2 bg-light rounded p-1 mb-2">
                    <button class="btn btn-sm btn-white border px-2 py-0 fw-bold"
                      @click="$emit('update-quantity', index, -1)" :disabled="item.quantity <= 1">−</button>
                    <span class="fw-bold px-1" style="min-width: 1.5ch; text-align: center">{{ item.quantity }}</span>
                    <button class="btn btn-sm btn-white border px-2 py-0 fw-bold"
                      @click="$emit('update-quantity', index, 1)">+</button>
                  </div>

                  <button class="btn btn-sm btn-link text-danger text-decoration-none p-0" style="font-size: 0.85rem"
                    @click="$emit('remove-item', index)">Remove</button>
                </div>
              </div>
            </li>
          </ul>
          <div class="card-footer d-flex flex-column gap-1 fw-bold fs-5">
            <div class="d-flex justify-content-between text-secondary fs-6">
              <span>Subtotal:</span>
              <span>${{ subtotal }}</span>
            </div>
            <div v-if="discountAmount > 0" class="d-flex justify-content-between text-success fs-6">
              <span>Discount:</span>
              <span>-${{ discountAmount }}</span>
            </div>
            <div class="d-flex justify-content-between border-top pt-2 mt-1">
              <span>Total to Pay:</span>
              <span>${{ finalTotal }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card p-4">
          <h5 class="mb-3">1. Contact Details</h5>

          <div class="mb-3">
            <label class="form-label">Name</label>
            <input v-model="customer.name" type="text" class="form-control" placeholder="John Doe">
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input v-model="customer.email" type="email" class="form-control" placeholder="john@computing.smu.edu.sg">
          </div>
          <div class="mb-3">
            <label class="form-label">Phone/Tele</label>
            <input v-model="customer.tele" type="text" class="form-control" placeholder="91234567">
          </div>

          <div class="mb-3">
            <label class="form-label">Instagram Handle (For Giveaway)</label>
            <div class="input-group">
              <span class="input-group-text">@</span>
              <input v-model="customer.instagram" type="text" class="form-control" placeholder="username">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Special Note</label>
            <textarea v-model="customer.note" class="form-control" rows="2"></textarea>
          </div>

          <hr class="my-4">

          <h5 class="mb-3">2. Payment</h5>

          <div class="text-center mb-3 p-3 bg-light rounded border">
            <p class="mb-2 fw-bold">Scan to Pay via PayNow</p>
            <img src="../../public/paynow.png" alt="PayNow QR" class="img-fluid mb-2" style="max-width: 200px;">
            <p class="mb-0 text-muted small">Paynow to Janell</p>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold">Upload Payment Screenshot *</label>
            <input type="file" class="form-control" @change="uploadProof" accept="image/*">
            <div v-if="customer.payment_proof" class="mt-2 text-success small">
              ✅ Receipt uploaded successfully!
            </div>
            <div v-if="isUploading" class="mt-2 text-primary small">
              Uploading... please wait...
            </div>
          </div>


          <hr class="my-4">

          <h5 class="mb-3">3. PDPA Acknowledgement</h5>
          <div class="form-check mb-3">
            <p>
              By submitting this Form, you agree that Singapore Management University (SMU) as represented by SMU SoundFoundry may collect, use and disclose your personal data that you provide in this Form for the following purpose(s):<br /><br />
              i) Administrative and safety matters regarding your participation in SMU SoundFoundry's Valentine's Day Merchandise Sales and Giveaway. If you are providing someone else’s personal data or submitting this Form on behalf of someone else, you hereby represent, warrant and declare that you have obtained consent from the named individual(s) in this Form, for the collection, use and disclosure of his or her personal data by you to SMU. <br /><br />
              You also consent to the disclosure of the personal data provided by you in this Form, to SMU’s partners or affiliates and other third party service providers that SMU may engage from time to time. <br /><br />
              If any of the personal data provided by you in this Form is disclosed to SMU’s partners or affiliates, and/or third party service providers, SMU will ensure that the disclosure is in accordance with the PDPA. <br /><br />
              If you wish to find out more about SMU’s personal data protection policy, please view SMU’s Personal Data Protection Statement at <a href="http://www.smu.edu.sg/personal-data-protection" class="text-decoration-none fw-normal">http://www.smu.edu.sg/personal-data-protection</a>. Should you wish at any time to withdraw your consent for the collection, use, and/or disclosure of your personal data after submitting this Form, please contact us at <a href="mailto:soundfoundry@sa.smu.edu.sg" class="text-decoration-none fw-normal">soundfoundry@sa.smu.edu.sg</a>.
            </p>
            <input v-model="customer.pdpa_consent" class="form-check-input" type="checkbox" id="pdpaCheck">
            <label class="form-check-label" for="pdpaCheck">
              I consent to the above
            </label>
          </div>

          <button @click="submitOrder" class="btn bg-dark-pink w-100 btn-lg mt-3 fw-bold" style="color: black; border-color: black;"
            :disabled="isSubmitting || isUploading || cart.length === 0 || !customer.payment_proof || !customer.pdpa_consent">
            {{ isSubmitting ? 'Processing...' : 'Confirm Payment & Order' }}
          </button>

        </div>
      </div>
    </div>
  </div>
</template>