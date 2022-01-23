<template>
	<div
		v-if="enable"
		class="row">
		<div class="col">
			<div class="row pb-2 justify-content-end">
				<div class="p-2 withBackground">
					<img
						id="icon-temp"
						src="~/assets/images/temperature.svg"
						class="align-self-center">
					<span>{{ temperature }}&deg;C</span>
				</div>
			</div>
			<div class="row pb-2 justify-content-end">
				<div class="p-2 withBackground">
					<img
						id="icon-humidity"
						src="~/assets/images/humidity.svg"
						class="align-self-center">
					<span>{{ humidity }}%</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: 'DhtWidget',
	data() {
		return {
			enable: process.env.DHT === 'true',
			timer: process.env.DHT_TIMER,
			temperature: '~',
			humidity: '~',
			errors: []
		}
	},
	mounted() {
		if (this.enable) {
			this.getData()
			this.interval = setInterval(this.getData, this.timer * 1000)
		}
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		getData() {
			this.$axios.get('/dht')
				.then((response) => {
					this.temperature = response.data.temperature.toFixed(0)
					this.humidity = response.data.humidity.toFixed(0)
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
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
