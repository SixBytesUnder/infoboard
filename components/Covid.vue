<template>
	<div
		v-if="enable"
		class="col">
		<div class="row">
			<div class="col mx-2">
				<div class="row px-3 justify-content-end">
					<div class="d-flex flex-wrap p-2 withBackground">
						COVID-19 cases
						<table class="table table-sm table-bordered table-dark">
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
								<tr
									v-for="(country, index) in dataSet"
									:key="index">
									<td>{{ country.date }}</td>
									<td>{{ country.country_name }}</td>
									<td>{{ Intl.NumberFormat().format(country.total_cases) }}</td>
									<td>{{ Intl.NumberFormat().format(country.new_cases) }}</td>
									<td>{{ Intl.NumberFormat().format(country.total_deaths) }}</td>
									<td>{{ Intl.NumberFormat().format(country.new_deaths) }}</td>
								</tr>
							</tbody>
						</table>
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
			enable: process.env.C19_ENABLE === 'true',
			timer: process.env.C19_TIMER,
			countries: process.env.C19_COUNTRY.split(','),
			dateFormat: process.env.C19_DATE_FORMAT,
			dataSet: [],
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
			axios.get('https://covid.ourworldindata.org/data/owid-covid-data.json')
				.then((response) => {
					// get last two days for each country
					if (this.countries.length > 0) {
						this.countries.forEach((countryCode) => {
							const country = response.data[countryCode]
							const countryData = country.data.slice(Math.max(country.data.length - 2, 0)).reverse()
							countryData.forEach((row) => {
								row.country_name = country.location
								row.date = moment(row.date).format(this.dateFormat)
								this.dataSet.push(row)
							})
						})
					} else {
						console.log('No countries specified to pull data for.')
					}
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		}
	}
}
</script>

<style scoped>
.table {
	color: #fff;
	font-size: 0.7rem;
}
</style>
