<template>
	<div
		v-if="weatherMoreInfo && weather"
		class="row">
		<div class="ms-auto p-2 mb-2 smaller withBackground">
			<div
				v-for="(name, slug) in fieldsMore"
				:key="slug"
				class="row px-2">
				<div
					v-if="weather && weather[slug]"
					class="col pl-2 pr-3 border-bottom border-end">
					{{ name }}
				</div>
				<div
					v-if="weather && weather[slug]"
					class="col px-2 border-bottom text-center">
					<span v-if="typeof units[slug] === 'object'">
						{{ units[slug][Math.round(weather[slug])] }}
					</span>
					<span v-else>
						{{ weather[slug] }} {{ units[slug] }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import units from '~/data/units'

export default {
	name: 'WeatherMore',
	props: {
		weatherMoreInfo: {
			type: Boolean,
			default() {
				return false
			}
		},
		weather: {
			type: [Object, Array],
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			units: process.env.WEATHER_UNITS === 'imperial' ? units.imperial : units.metric,
			fieldsMore: {
				humidity: 'Humidity',
				windSpeed: 'Wind speed',
				windGust: 'Wind gust speed',
				pressureSurfaceLevel: 'Barometric pressure',
				solarGHI: 'Solar radiation reaching the surface',
				moonPhase: 'Moon phase',
				particulateMatter25: 'PM < 2.5 μm',
				particulateMatter10: 'PM < 10 μm',
				pollutantO3: 'Ozone',
				pollutantNO2: 'Nitrogen Dioxide',
				pollutantCO: 'Carbon Monoxide',
				pollutantSO2: 'Sulfur Dioxide',
				epaHealthConcern: 'Air quality index per US EPA standard',
				treeIndex: 'Pollen index for trees',
				weedIndex: 'Pollen index for weeds',
				grassIndex: 'Pollen index for grass'
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
