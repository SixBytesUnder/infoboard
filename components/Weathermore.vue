<template>
	<div
		v-if="weatherMoreInfo && weather"
		class="ml-auto p-2 mb-2 mr-2 smaller withBackground">
		<div
			v-for="(name, slug) in fieldsMore"
			:key="slug"
			class="row px-2">
			<div
				v-if="weather && weather[slug]"
				class="col pl-2 pr-3 border-bottom border-right">
				{{ name }}
			</div>
			<div class="col px-2 border-bottom text-center">
				{{ weather[slug].value }} {{ weather[slug].units }}
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'Weathermore',
	props: {
		weatherMoreInfo: {
			type: Boolean,
			default() {
				return false
			}
		},
		weather: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			fieldsMore: {
				humidity: 'Humidity',
				wind_speed: 'Wind speed',
				wind_gust: 'Wind gust speed',
				baro_pressure: 'Barometric pressure',
				surface_shortwave_radiation: 'Solar radiation reaching the surface',
				moon_phase: 'Moon phase',
				pm25: 'Particulate Matter < 2.5 μm',
				pm10: 'Particulate Matter < 10 μm',
				o3: 'Ozone',
				no2: 'Nitrogen Dioxide',
				co: 'Carbon Monoxide',
				so2: 'Sulfur Dioxide',
				epa_health_concern: 'Air quality index per US EPA standard',
				pollen_tree: 'ClimaCell pollen index for trees',
				pollen_weed: 'ClimaCell pollen index for weeds',
				pollen_grass: 'ClimaCell pollen index for grass'
			}
		}
	}
}
</script>

<style scoped>
.smaller {
	font-size: 0.75rem;
}
</style>
