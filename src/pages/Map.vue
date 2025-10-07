<template>
  <section class="grid" style="gap:16px;">
    <div class="card">
      <h2>Support Map</h2>
      <p class="muted">Feature 1: Search places • Feature 2: Route from my location</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        <input v-model="query" class="input" placeholder="Search clinics, helplines…" @keyup.enter="search" aria-label="Search places" />
        <button class="btn" @click="search">Search</button>
        <button class="btn secondary" @click="routeToSelected" :disabled="!selected">Route</button>
      </div>
    </div>

    <div id="map" style="height:520px; border-radius:12px; overflow:hidden;"></div>
  </section>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import { onMounted, ref } from 'vue'

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'
let map: mapboxgl.Map
const query = ref('')
const selected = ref<mapboxgl.Marker | null>(null)
let userLngLat: [number, number] | null = null
onMounted(() => {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [144.9631, -37.8136],
    zoom: 11
  })
  // find user loc
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userLngLat = [pos.coords.longitude, pos.coords.latitude]
      new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat(userLngLat).setPopup(new mapboxgl.Popup().setText('You are here'))
        .addTo(map)
      map.flyTo({ center: userLngLat, zoom: 12 })
    })
  }
})

const search = async () => {
  // Mapbox Geocoding
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.value)}.json?access_token=${mapboxgl.accessToken}&limit=5`
  const res = await fetch(url); const data = await res.json()
  // add markers
  data.features.forEach((f: any) => {
    const m = new mapboxgl.Marker().setLngLat(f.center).setPopup(new mapboxgl.Popup().setText(f.place_name)).addTo(map)
    m.getElement().addEventListener('click', () => (selected.value = m))
  })
  if (data.features[0]) map.flyTo({ center: data.features[0].center, zoom: 12 })
}

const routeToSelected = async () => {
  if (!userLngLat || !selected.value) return
  const dest = (selected.value as any)._lngLat // internal; fine for demo
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLngLat[0]},${userLngLat[1]};${dest.lng},${dest.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
  const res = await fetch(url); const data = await res.json()
  const coords = data.routes[0].geometry.coordinates
  if (map.getSource('route')) { map.removeLayer('route'); map.removeSource('route') }
  map.addSource('route', { type: 'geojson', data: { type:'Feature', geometry:{ type:'LineString', coordinates: coords } } })
  map.addLayer({ id:'route', type:'line', source:'route', paint:{ 'line-color':'#2563eb', 'line-width':4 } })
}
</script>

<style scoped>
.muted { color:#9fb6cc; }
</style>
