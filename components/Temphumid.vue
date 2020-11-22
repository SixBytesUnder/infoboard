<template>
	<div
		v-if="enable"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div class="row px-3 pb-2 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						<img
							id="icon-temp"
							src="~/assets/images/temperature.svg"
							class="mr-2">
						<span>{{ temperature }}&deg;C</span>
					</div>
				</div>
				<div class="row px-3 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						<img
							id="icon-humidity"
							src="~/assets/images/humidity.svg"
							class="align-self-center mr-2">
						<span>{{ humidity }}%</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

export default {
	data() {
		return {
			enable: process.env.TEMPHUMID === 'true',
			activeFrom: moment(process.env.TH_ACTIVE_FROM, process.env.TIME_FORMAT).valueOf(),
			activeTo: moment(process.env.TH_ACTIVE_TO, process.env.TIME_FORMAT).valueOf(),
			timer: process.env.TH_TIMER,
			temperature: '~',
			humidity: '~',
			errors: []
		}
	},
	mounted() {
		this.getData()
		this.interval = setInterval(this.getData, this.timer * 1000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		getData() {
			console.log(process.env.NODE_ENV)
			// check if current time is between working hours
			// if (moment().isBetween(this.activeFrom, this.activeTo)) {
			axios.get('/api/dht')
				.then((response) => {
					this.temperature = response.data.temperature.toFixed(0)
					this.humidity = response.data.humidity.toFixed(0)
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
			// } else {
			// 	this.temperature = '~'
			// 	this.humidity = '~'
			// }
		}
	}
}
</script>

<style scoped>
#icon-temp {
	width: 1rem;
}
#icon-humidity {
	width: 1.8rem;
}
</style>
