<template>
	<div
		v-if="weatherMoreInfo && weather"
		class="ml-auto p-2 mb-2 mr-2 smaller withBackground">
		<div
			v-for="(name, slug) in fieldsMore"
			:key="slug"
			class="row px-2">
			<div
				v-if="weather && weather[0].intervals[0].values[slug]"
				class="col pl-2 pr-3 border-bottom border-right">
				{{ name }}
			</div>
			<div
				v-if="weather && weather[0].intervals[0].values[slug]"
				class="col px-2 border-bottom text-center">
				<span v-if="typeof units[slug] === 'object'">
					{{ units[slug][weather[0].intervals[0].values[slug]] }}
				</span>
				<span v-else>
					{{ weather[0].intervals[0].values[slug] }} {{ units[slug] }}
				</span>
			</div>
		</div>
	</div>
</template>

<script>
import units from '~/data/units'

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
			type: Array,
			default() {
				return []
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
				particulateMatter25: 'Particulate Matter < 2.5 μm',
				particulateMatter10: 'Particulate Matter < 10 μm',
				pollutantO3: 'Ozone',
				pollutantNO2: 'Nitrogen Dioxide',
				pollutantCO: 'Carbon Monoxide',
				pollutantSO2: 'Sulfur Dioxide',
				epaHealthConcern: 'Air quality index per US EPA standard',
				treeIndex: 'ClimaCell pollen index for trees',
				weedIndex: 'ClimaCell pollen index for weeds',
				grassIndex: 'ClimaCell pollen index for grass'
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
