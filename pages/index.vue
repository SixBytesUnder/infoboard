<template>
	<div class="container-fluid pt-2">
		<Background
			v-if="enableWeather === true ? weather.weather_code : true"
			:weather="weather" />
		<div class="row mx-2 py-2">
			<Datetime />
			<Weather
				v-if="enableWeather"
				@show-forecast="onShowForecast"
				@weather-more="onWeatherMore"
				@weather-more-show="onWeatherMoreShow" />
		</div>
		<Forecast :show-forecast="showForecast" />

		<Tfl
			:weather-more-info="weatherMoreInfo"
			:weather="weather" />
		<Covid />
		<div class="row pb-2">
			<Calendar />
		</div>
	</div>
</template>

<script>
import Background from '~/components/Background.vue'
import Datetime from '~/components/Datetime.vue'
import Weather from '~/components/Weather.vue'
import Forecast from '~/components/Forecast.vue'
import Calendar from '~/components/Calendar.vue'
import Tfl from '~/components/Tfl.vue'
import Covid from '~/components/Covid.vue'

export default {
	components: {
		Background,
		Datetime,
		Weather,
		Forecast,
		Calendar,
		Tfl,
		Covid
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			weather: {},
			showForecast: false,
			weatherMoreInfo: false
		}
	},
	head() {
		return {
			bodyAttrs: {
				class: this.magicMirror ? 'mm' : ''
			}
		}
	},
	methods: {
		onShowForecast(value) {
			this.showForecast = !this.showForecast
		},
		onWeatherMoreShow(value) {
			this.weatherMoreInfo = !this.weatherMoreInfo
		},
		onWeatherMore(value) {
			this.weather = value
		}
	}
}
</script>

<style>
html, body {
	background-color: #292929;
	color: #fff;
	font-family: 'Cousine', monospace;
	font-size: 1rem;
	height: 100vh;
	-webkit-user-select: none; /* Safari */
	-moz-user-select: none; /* Firefox */
	-ms-user-select: none; /* IE10+/Edge */
	user-select: none; /* Standard */
}

.withBackground {
	background-color: #333333;
	background-color: rgba(41, 41, 41, 0.3);
	border-radius: 0.3rem;
	width: fit-content;
}

/* Styles for Magic Mirror mode - highest contrast */
.mm .withBackground {
	background: none;
}

@media (max-width: 575.98px) {
	html, body {
		font-size: 0.9rem;
	}
}
@media (max-width: 320px) {
	html, body {
		font-size: 0.8rem;
	}
}
</style>
