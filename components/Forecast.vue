<template>
	<div 
		v-if="$store.state.forecast && $store.state.showForecast && enableWeather === 'true'" 
		class="row mx-0 py-2">
		<div 
			v-for="(day, index) of $store.state.forecast" 
			:key="index" 
			class="forecastWrapper col withBackground mx-2 mb-2">
			<div class="forecast h-100 m-auto">
				<div class="col">
					{{ moment.unix(day.time).format('dddd') }}
				</div>
				<div class="col forecastIcon">
					<img 
						:src="'/images/'+day.icon+'.svg'" 
						:alt="day.summary">
				</div>
				<div class="col">
					{{ roundValue(day.temperatureHigh) }}&deg;{{ units }}
				</div>
				<div class="col">
					{{ roundValue(day.temperatureLow) }}&deg;{{ units }}
				</div>
				<div class="col small px-0">
					{{ day.summary }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import moment from 'moment'

export default {
	data: function() {
		return {
			enableWeather: process.env.WEATHER,
			tempRouded: process.env.WEATHER_ROUNDED === 'true' ? true : false,
			units: process.env.WEATHER_UNITS === 'fahrenheit' ? 'F' : 'C',
			moment: moment
		}
	},
	methods: {
		roundValue(val) {
			if (this.tempRouded === true) {
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
