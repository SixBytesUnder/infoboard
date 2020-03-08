<template>
	<div
		v-if="enable === 'true'"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div class="row px-3 pb-2 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						<img
							id="icon-temp"
							src="~/assets/images/temperature.svg"
							class="mr-2">
						<p>{{ temperature }}&deg;C</p>
					</div>
				</div>
				<div class="row px-3 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						<img
							id="icon-humidity"
							src="~/assets/images/humidity.svg"
							class="align-self-center mr-2">
						<p>{{ humidity }}%</p>
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
			env: process.env.NODE_ENV,
			enable: process.env.TEMPHUMID,
			activeFrom: moment(process.env.TH_ACTIVE_FROM, process.env.TIME_FORMAT).valueOf(),
			activeTo: moment(process.env.TH_ACTIVE_TO, process.env.TIME_FORMAT).valueOf(),
			showDetails: false,
			temperature: 0,
			humidity: 0,
			errors: []
		}
	},
	mounted() {
		this.getData()
		this.interval = setInterval(this.getData, process.env.TH_FREQUENCY * 1000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleDetails() {
			this.showDetails = !this.showDetails
		},
		getData() {
			// check if current time is between working hours
			if (moment().isBetween(this.activeFrom, this.activeTo)) {
				axios.get('/api/dht')
					.then((response) => {
						this.temperature = response.data.temperature
						this.humidity = response.data.humidity
					})
					.catch((err) => {
						if (this.env === 'development') { console.log(err) }
					})
			}
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
