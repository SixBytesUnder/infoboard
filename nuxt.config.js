const pkg = require('./package')

export default {
	// Global page headers (https://go.nuxtjs.dev/config-head)
	head: {
		htmlAttrs: {
			lang: 'en'
		},
		title: pkg.name,
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
			{ hid: 'description', name: 'description', content: pkg.description }
		],
		script: [
			{ src: 'https://apis.google.com/js/api.js' }
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
			{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cousine:wght@400;500;700&display=swap' }
		]
	},

	// PWA manifest file
	manifest: {
		name: pkg.name,
		short_name: pkg.name,
		lang: 'en-GB',
		background_color: '#292929',
		theme_color: '#292929',
		description: pkg.description,
		display: 'standalone'
	},

	// Global CSS (https://go.nuxtjs.dev/config-css)
	css: [
	],

	// Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
	plugins: [
	],

	// Auto import components (https://go.nuxtjs.dev/config-components)
	components: true,

	// Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
	buildModules: [
		// https://go.nuxtjs.dev/eslint
		'@nuxtjs/eslint-module'
	],

	// Modules (https://go.nuxtjs.dev/config-modules)
	modules: [
		// https://go.nuxtjs.dev/bootstrap
		'bootstrap-vue/nuxt',
		// https://go.nuxtjs.dev/axios
		'@nuxtjs/axios',
		// https://go.nuxtjs.dev/pwa
		'@nuxtjs/pwa',
		'@nuxtjs/dotenv'
	],

	bootstrapVue: {
		bootstrapCSS: true,
		bootstrapVueCSS: false,
		componentPlugins: [],
		directivePlugins: [],
		components: ['BContainer', 'BRow', 'BCol', 'BButton', 'BButtonGroup', 'BTable'],
		directives: []
	},

	// Axios module configuration (https://go.nuxtjs.dev/config-axios)
	axios: {
		baseURL: '/api'
	},

	publicRuntimeConfig: {},
	privateRuntimeConfig: {},

	// Build Configuration (https://go.nuxtjs.dev/config-build)
	build: {
		babel: {
			compact: true
		}
	},

	serverMiddleware: [
		// API middleware
		'~/server/api/index.js'
	]
}
