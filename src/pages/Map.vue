<template>
  <section class="grid" style="gap:16px; max-width:1200px; margin-inline:auto;">
    <div class="card">
      <h2>Google Maps — Two Points Only</h2>
      <p class="muted">1st click sets <b>A</b>. Any later click/search sets <b>B</b> & draws the route. “Clear” removes A/B and the route completely.</p>
      <p v-if="error" style="color:#b91c1c; margin-top:6px;">{{ error }}</p>
    </div>

    <div class="card">
      <div class="row" style="gap:10px; flex-wrap:wrap; align-items:center;">
        <label>Search (sets B)
          <input id="gm-autocomplete" class="input" placeholder="e.g., park, clinic, cafe" style="min-width:260px;" />
        </label>

        <label>Mode
          <select class="input" v-model="mode">
            <option value="DRIVING">Driving</option>
            <option value="WALKING">Walking</option>
            <option value="BICYCLING">Cycling</option>
          </select>
        </label>

        <button class="btn secondary" @click="useMyLocation">Use My Location (reset A)</button>
        <button class="btn ghost" @click="clearAll" :disabled="!hasAnything">Clear</button>
      </div>
      <p class="muted" style="margin-top:6px;">After A is set, every new map click or search only moves B and recalculates the route.</p>
    </div>

    <div id="map" class="map"></div>

    <div class="card" v-if="summary.distance">
      <h3>Route Summary</h3>
      <p><b>Distance:</b> {{ summary.distance }} • <b>Duration:</b> {{ summary.duration }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string
const error = ref('')

const map = ref<any>(null)
const mode = ref<'DRIVING'|'WALKING'|'BICYCLING'>('DRIVING')

const origin = ref<any>(null)        // google.maps.LatLng | null
const destination = ref<any>(null)   // google.maps.LatLng | null
const markerA = ref<any>(null)       // google.maps.Marker | null
const markerB = ref<any>(null)       // google.maps.Marker | null
const acInput = ref<HTMLInputElement | null>(null)

const dirService = ref<any>(null)
const dirRenderer = ref<any>(null)

const summary = ref<{distance: string, duration: string}>({ distance: '', duration: '' })
const hasRoute = computed(() => !!summary.value.distance)
const hasAnything = computed(() => !!origin.value || !!destination.value || hasRoute.value)

function loadGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.importLibrary) return resolve()
    if (!GOOGLE_KEY) {
      error.value = 'Missing Google Maps API key. Add VITE_GOOGLE_MAPS_KEY to .env and restart (npm run dev).'
      return reject(new Error('NO_KEY'))
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=weekly&libraries=places&loading=async`
    script.async = true
    script.onerror = () => { error.value = 'Failed to load Google Maps script.'; reject(new Error('LOAD_FAIL')) }
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

function centerMel() {
  map.value?.setCenter({ lat: -37.8136, lng: 144.9631 })
  map.value?.setZoom(12)
}

function setOrMoveMarkerA(pos: any) {
  const g = (window as any).google
  if (!markerA.value) markerA.value = new g.maps.Marker({ position: pos, map: map.value, label: 'A' })
  else markerA.value.setPosition(pos)
}
function setOrMoveMarkerB(pos: any) {
  const g = (window as any).google
  if (!markerB.value) markerB.value = new g.maps.Marker({ position: pos, map: map.value, label: 'B' })
  else markerB.value.setPosition(pos)
}
function removeMarker(refMarker: any) {
  if (refMarker.value) {
    refMarker.value.setMap(null)
    refMarker.value = null
  }
}
function resetSummary() { summary.value = { distance: '', duration: '' } }

async function initMap() {
  const g = (window as any).google
  await g.maps.importLibrary('maps')
  await g.maps.importLibrary('places')
  await g.maps.importLibrary('routes')

  map.value = new g.maps.Map(document.getElementById('map'), { center: { lat:-37.8136, lng:144.9631 }, zoom: 12 })
  dirService.value = new g.maps.DirectionsService()
 
  dirRenderer.value = new g.maps.DirectionsRenderer({ map: map.value, suppressMarkers: true })


  map.value.addListener('click', (e: any) => {
    const ll = e.latLng
    if (!origin.value) {
      origin.value = ll
      setOrMoveMarkerA(ll)
    } else {
      destination.value = ll
      setOrMoveMarkerB(ll)
      calcRoute()
    }
  })


  acInput.value = document.getElementById('gm-autocomplete') as HTMLInputElement
  const ac = new g.maps.places.Autocomplete(acInput.value, { fields: ['geometry','name'] })
  ac.addListener('place_changed', () => {
    const place = ac.getPlace()
    if (!place?.geometry?.location) return
    if (!origin.value) {
      origin.value = map.value.getCenter()
      setOrMoveMarkerA(origin.value)
    }
    destination.value = place.geometry.location
    setOrMoveMarkerB(destination.value)
    map.value.panTo(destination.value); map.value.setZoom(14)
    calcRoute()
  })
}

function calcRoute() {
  if (!origin.value || !destination.value) return
  const g = (window as any).google
  dirService.value.route(
    {
      origin: origin.value,
      destination: destination.value,
      travelMode: g.maps.TravelMode[mode.value]
    },
    (res: any, status: any) => {
      if (status !== 'OK' || !res) { error.value = `Route failed: ${status}`; return }
      dirRenderer.value.setDirections(res)
      const leg = res.routes[0].legs[0]
      summary.value = {
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || ''
      }

      const bounds = new g.maps.LatLngBounds()
      res.routes[0].overview_path.forEach((p: any) => bounds.extend(p))
      map.value.fitBounds(bounds, 50)
    }
  )
}

function clearAll() {

  if (dirRenderer.value) dirRenderer.value.setDirections({ routes: [] })
  resetSummary()

  removeMarker(markerA)
  removeMarker(markerB)


  origin.value = null
  destination.value = null


  if (acInput.value) acInput.value.value = ''


  centerMel()
}

function useMyLocation() {
  if (!map.value) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {

      const g = (window as any).google
      const ll = new g.maps.LatLng(pos.coords.latitude, pos.coords.longitude)

      if (dirRenderer.value) dirRenderer.value.setDirections({ routes: [] })
      resetSummary()

      destination.value = null
      removeMarker(markerB)

      origin.value = ll
      setOrMoveMarkerA(ll)
      map.value.panTo(ll); map.value.setZoom(14)
    },
    () => { error.value = 'Geolocation failed. Please allow location permission.' }
  )
}

onMounted(async () => {
  try {
    await loadGoogle()
    await initMap()
  } catch (e) {}
})
</script>

<style scoped>
.map { width: 100%; height: 70vh; border-radius: 12px; overflow: hidden; }
.muted { color:#9fb6cc; }
</style>
