const webpack = require('webpack')

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'infoboard',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Responsive infoboard showing time, weather, transport and photos from a local NAS' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Cousine:400,500,700' }
    ]
  },
  /*
  ** Global CSS
  */
  // css: [
  //   'bootstrap',
  //   '~/assets/css/bootstrap.css',
  //   '~/assets/css/main.css'
  // ],
  /*
  ** Add axios globally
  */
  build: {
    vendor: [
      'axios',
      'bootstrap'
    ],
    plugins: [
      // set shortcuts as global for bootstrap
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
        // Popper: ['popper.js', 'default']
      })
    ],
    /*
    ** Run ESLINT on save
    */
    extend (config, { isDev }) {
      if (isDev && process.client) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  },
  css: [
    'bootstrap/dist/css/bootstrap.css'
    // '~/assets/css/main.css'
  ],
  // include bootstrap js on startup
  plugins: ['~plugins/bootstrap.js'],
  serverMiddleware: [
    // API middleware
    '~/api/index.js'
  ],
  modules: [
    '@nuxtjs/dotenv'
  ]
}
