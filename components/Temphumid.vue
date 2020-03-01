<template>
	<div
		v-if="enable === 'true'"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div
					class="px-2 py-2 withBackground"
					@click="toggleDetails">
					<p>{{ temperature }}°C</p>
					<p>{{ humidity }}%</p>
					<div
						v-if="showDetails"
						class="media-body mx-2">
						<p>
							<span class="badge badge-light mr-1">
								data graph
							</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'

export default {
	data: function () {
		return {
			env: process.env.NODE_ENV,
			enable: process.env.TEMPHUMID,
			showDetails: false,
			temperature: 0,
			humidity: 0,
			errors: []
		}
	},
	mounted() {
		this.getData()
		this.interval = setInterval(this.getData, 60000)
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		toggleDetails() {
			this.showDetails = !this.showDetails
		},
		getData() {
			axios.get('/api/dht')
				.then((response) => {
					this.temperature = response.data.temp
					this.humidity = response.data.humidity
					console.log(response.data)
				})
				.catch((err) => {
					if (this.env === 'development') console.log(err)
				})
		}
	}
}
</script>

<style scoped>
</style>
