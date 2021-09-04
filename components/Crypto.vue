<template>
	<div
		v-if="enable"
		class="row">
		<div class="col">
			<div class="row justify-content-end">
				<div class="d-flex flex-wrap p-2 mb-2 withBackground">
					<div>
						<span @click="toggleData">Crypto prices</span>
					</div>
					<table
						v-if="showData"
						class="table table-sm table-bordered table-dark">
						<thead>
							<tr>
								<th scope="col">
									Date
								</th>
								<th scope="col">
									Country
								</th>
								<th scope="col">
									Total Cases
								</th>
								<th scope="col">
									New Cases
								</th>
								<th scope="col">
									Total Deaths
								</th>
								<th scope="col">
									New Deaths
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>test</td>
								<td>test</td>
								<td>test</td>
								<td>test</td>
								<td>test</td>
								<td>test</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			enable: process.env.CRYPTO_ENABLE === 'true',
			showData: true,
			wsData: {
				apikey: process.env.CRYPTO_API_KEY,
				type: 'exrate',
				heartbeat: false,
				asset_id_base: 'BTC',
				asset_id_quote: 'USD',
				subscribe_data_type: ['quote'],
				subscribe_filter_asset_id: ['BTC', 'ETH']
			},
			dataSet: [],
			errors: []
		}
	},
	mounted() {
		// const socket = new WebSocket('wss://ws.coinapi.io/v1/')
		const socket = new WebSocket('wss://ws-sandbox.coinapi.io/v1/')
		socket.onopen = (event) => {
			socket.send(JSON.stringify(this.wsData))
		}
		socket.onmessage = (event) => {
			console.log(event.data)
			// this.dataSet = event.data
		}
	},
	methods: {
		toggleData() {
			this.showData = !this.showData
		}
	}
}
</script>

<style scoped>
.table {
	color: #fff;
	font-size: 0.7rem;
}
.table-dark {
	background-color: #343a40;
	background-color: rgba(52, 58, 64, 0.7);
}
</style>
