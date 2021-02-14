<template>
	<div class="container-fluid pt-2">
		<Background
			v-if="enableWeather === true"
			:weather="weather" />
		<div class="row mx-2 py-2">
			<Datetime />
			<Weather
				v-if="enableWeather"
				@show-forecast="onShowForecast"
				@weather-more="onWeatherMore"
				@weather-more-show="onWeatherMoreShow" />
		</div>
		<Forecast
			:forecast-data="weather"
			:show-forecast="showForecast" />

		<div class="row pt-2">
			<div class="col-12 col-sm-6">
				<Tfl />
				<Calendar />
			</div>
			<div class="col-12 col-sm-6">
				<Weathermore
					:weather-more-info="weatherMoreInfo"
					:weather="weather" />
				<Dht />
				<Sds />
				<Covid />
			</div>
		</div>
	</div>
</template>

<script>
import Background from '~/components/Background.vue'
import Datetime from '~/components/Datetime.vue'
import Weather from '~/components/Weather.vue'
import Weathermore from '~/components/Weathermore.vue'
import Forecast from '~/components/Forecast.vue'
import Calendar from '~/components/Calendar.vue'
import Tfl from '~/components/Tfl.vue'
import Dht from '~/components/Dht.vue'
import Sds from '~/components/Sds.vue'
import Covid from '~/components/Covid.vue'

export default {
	components: {
		Background,
		Datetime,
		Weather,
		Weathermore,
		Forecast,
		Calendar,
		Tfl,
		Dht,
		Sds,
		Covid
	},
	data() {
		return {
			enableWeather: process.env.WEATHER === 'true',
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			weather: [],
			showForecast: false,
			weatherMoreInfo: false
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
	},
	head() {
		return {
			bodyAttrs: {
				class: this.magicMirror ? 'mm' : ''
			}
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
