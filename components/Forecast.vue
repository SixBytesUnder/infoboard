<template>
	<div
		v-if="forecast && showForecast && enableWeather"
		class="row mx-0 py-2">
		<div
			v-for="(day, index) of forecast"
			:key="index"
			class="forecastWrapper col withBackground mx-2 mb-2">
			<div class="forecast h-100 m-auto">
				<div class="col">
					{{ moment(day.observation_time.value).format('dddd') }}
				</div>
				<div class="col forecastIcon">
					<img
						:src="day.weather_code ? loadImage(`images/${day.weather_code.value}.svg`) : loadImage('images/missing.svg')"
						:alt="day.weather_code.value">
				</div>
				<div class="col">
					{{ roundValue(day.temp[1].max.value) }}&deg;{{ day.temp[1].max.units }}
				</div>
				<div class="col">
					{{ roundValue(day.temp[0].min.value) }}&deg;{{ day.temp[0].min.units }}
				</div>
				<div class="col small px-0">
					{{ day.weather_code.value.split('_').join(' ') }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import moment from 'moment'

export default {
	name: 'Forecast',
	props: {
		showForecast: {
			type: Boolean,
			default() {
				return false
			}
		}
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			tempRouded: process.env.WEATHER_ROUNDED === 'true',
			forecast: {},
			moment
		}
	},
	mounted() {
		this.getForecast()
		this.interval = setInterval(this.getForecast, 600000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		loadImage(path) {
			return require(`~/assets/${path}`)
		},
		getForecast() {
			this.$axios.get('/weather/forecast')
				.then((response) => {
					this.forecast = response.data.slice(0, 7)
				})
				.catch((err) => {
					console.log(err)
				})
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
