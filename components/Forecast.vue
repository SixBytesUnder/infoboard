<template>
	<div
		v-if="forecastData && showForecast && enableWeather"
		class="row position-relative">
		<div
			v-for="(day, index) of forecastData"
			:key="index"
			class="forecastWrapper mx-2 mb-2 col withBackground">
			<div class="forecast">
				<div class="col">
					{{ day.date }}
				</div>
				<div class="col forecastIcon">
					<img
						:src="day.weatherCode ? loadImage(`images/${day.weatherCode}.svg`) : loadImage('images/missing.svg')"
						:alt="units.weatherCode[day.weatherCode]">
				</div>
				<div class="col">
					{{ roundValue(Math.max(...day.temperature)) }}&deg;{{ units.temperature.charAt() }}
				</div>
				<div class="col">
					{{ roundValue(Math.min(...day.temperature)) }}&deg;{{ units.temperature.charAt() }}
				</div>
				<div class="col small px-0">
					{{ units.weatherCode[day.weatherCode] }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import units from '~/data/units'

export default {
	name: 'ForecastWidget',
	props: {
		showForecast: {
			type: Boolean,
			default() {
				return false
			}
		},
		forecastData: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			units: process.env.WEATHER_UNITS === 'imperial' ? units.imperial : units.metric
		}
	},
	methods: {
		loadImage(path) {
			return require(`~/assets/${path}`)
		},
		roundValue(val) {
			if (this.tempRouded) {
				return Math.round(val)
			} else {
				return val
			}
		}
	}
}
</script>

<style scoped>
.forecast {
	text-align: center;
}
.forecastIcon img {
	width: 50%;
}
@media (max-width: 575.98px) {
	.forecastWrapper {
		min-width: 45%;
	}
}
</style>
