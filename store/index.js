import Vuex from 'vuex'

const createStore = () => {
	return new Vuex.Store({
		state: {
			forecast: [],
			showForecast: false
		},
		mutations: {
			showForecast (state, payload) {
				state.showForecast = payload
			},
			loadForecast (state, payload) {
				state.forecast = payload
			}
		}
	})
}

export default createStore
