<template>
	<section class="container">
		<div
			id="backgroundImageBlur"
			:style="background" />
		<div
			id="backgroundImage"
			:style="background" />

		<div class="btn-group buttons">
			<button
				v-if="fullscreenEnabled === true"
				class="btn btn-sm btn-outline-dark"
				@click="fullscreen">
				fullscreen
			</button>
			<button
				v-if="showNavButtons === true"
				:disabled="disableButtons"
				class="btn btn-sm btn-outline-dark"
				@click="getNext('image')">
				{{ nextimage }}
			</button>
			<button
				v-if="enableFolderButton === true && showNavButtons === true"
				:disabled="disableButtons"
				class="btn btn-sm btn-outline-dark"
				@click="getNext('folder')">
				{{ nextfolder }}
			</button>
		</div>
	</section>
</template>

<script>
import axios from 'axios'
import EXIF from 'exif-js'
import Unsplash, { toJson } from 'unsplash-js'

export default {
	data: function () {
		return {
			imageInterval: process.env.IMAGE_INTERVAL,
			nasa: false,
			background: '',
			imageSrc: '',
			imageList: [],
			showNavButtons: false,
			enableFolderButton: true,
			disableButtons: false,
			fullscreenElement: undefined,
			fullscreenEnabled: false,
			nextimage: 'image',
			nextfolder: 'folder',
			// used to tell the backend what to show next
			lastImage: ''
		}
	},
	mounted() {
		this.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled
		this.imagesSource = process.env.IMAGES_SOURCE === undefined || process.env.IMAGES_SOURCE === '' ? 'local' : process.env.IMAGES_SOURCE
		this.showNavButtons = process.env.NAV_BUTTONS === 'true'
		this.perPage = !isNaN(process.env.PEXELS_PERPAGE) ? process.env.PEXELS_PERPAGE : 40
		this.page = !isNaN(process.env.PEXELS_PAGE) ? process.env.PEXELS_PAGE : 0
		if (this.imagesSource === 'single') {
			this.showNavButtons = false
			this.getBackground()
		} else if (this.imagesSource === 'nasa') {
			this.showNavButtons = false
			this.getNasaAPOD()
			this.interval = setInterval(this.getNasaAPOD, 1000 * 60 * 60)
		} else if (this.imagesSource === 'unsplash') {
			this.enableFolderButton = false
			this.getUnsplash()
			this.interval = setInterval(this.getUnsplash, this.imageInterval * 1000)
		} else if (this.imagesSource === 'pexels') {
			this.loadState()
			this.enableFolderButton = false
			this.getPexels(this.perPage, this.page)
			this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
		} else {
			this.loadState()
			this.getBackground()
			this.interval = setInterval(this.getBackground, this.imageInterval * 1000)
		}
	},
	beforeDestroy() {
		clearInterval(this.interval)
	},
	methods: {
		saveState() {
			let savedImageList

			try {
				savedImageList = JSON.stringify(this.imageList)
				localStorage.removeItem('infoboardBgrState')
				localStorage.setItem('infoboardBgrState', savedImageList)
			} catch (err) {
				if (this.env === 'development') console.log(err)
			}
		},
		loadState() {
			let savedImageList

			try {
				savedImageList = localStorage.getItem('infoboardBgrState')
				if (savedImageList !== null) {
					this.imageList = JSON.parse(savedImageList)
					// Clean saved list if user switched between local and Pexels
					if (this.imagesSource === 'local' && this.imageList[0].search('images.pexels.com') >= 0) {
						this.imageList = []
					} else if (this.imagesSource === 'pexels' && this.imageList[0].search('images.pexels.com') > 0) {
						this.imageList = []
					}
				}
			} catch (err) {
				if (this.env === 'development') console.log(err)
			}
		},
		fullscreen: function () {
			if (this.fullscreenEnabled === true) {
				this.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement

				if (this.fullscreenElement !== undefined) {
					if (document.exitFullscreen) {
						document.exitFullscreen()
					} else if (document.mozCancelFullScreen) {
						document.mozCancelFullScreen()
					} else if (document.webkitExitFullscreen) {
						document.webkitExitFullscreen()
					}
				} else {
					const element = document.documentElement
					if (element.requestFullscreen) {
						element.requestFullscreen()
					} else if (element.mozRequestFullScreen) {
						element.mozRequestFullScreen()
					} else if (element.webkitRequestFullscreen) {
						element.webkitRequestFullscreen()
					} else if (element.msRequestFullscreen) {
						element.msRequestFullscreen()
					}
				}
			}
		},
		getNext: function (param) {
			clearInterval(this.interval)
			if (this.imagesSource === 'unsplash') {
				this.getUnsplash()
				this.interval = setInterval(this.getUnsplash, this.imageInterval * 1000)
			} else if (this.imagesSource === 'pexels') {
				this.getPexels(this.perPage, this.page)
				this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
			} else {
				this.getBackground(param)
			}
		},
		pickImage: function () {
			// remove current image from array and display it
			this.lastImage = this.imageList.shift()
			this.imageSrc = encodeURIComponent(this.lastImage)
			this.background = `background-image: url("/api/background/${this.imageSrc}")`
			this.getMeta()
			// get buttons back to normal
			this.nextimage = 'image'
			this.nextfolder = 'folder'
			this.disableButtons = false
		},
		getBackground: async function (param) {
			if (param === 'image') {
				this.disableButtons = true
				clearInterval(this.interval)
			} else if (param === 'folder') {
				this.disableButtons = true
				this.imageList = []
				clearInterval(this.interval)
			}
			this.nextimage = '...'
			this.nextfolder = '...'

			if (this.imageList.length === 0) {
				// get new batch of images
				await axios.get(`/api/backgrounds/${this.lastImage}`)
					.then((response) => {
						this.imageList = response.data
						this.pickImage()
					})
					.catch((err) => {
						if (this.env === 'development') console.log(err)
					})
			} else {
				this.pickImage()
			}

			if (this.imageList.length === 0) {
				// get new batch of images
				await axios.get(`/api/backgrounds/${this.lastImage}`)
					.then((response) => {
						this.imageList = response.data
					})
					.catch((err) => {
						if (this.env === 'development') console.log(err)
					})
			}

			// save current images array state
			this.saveState()

			if (param === 'image' || param === 'folder') {
				this.interval = setInterval(this.getBackground, this.imageInterval * 1000)
			}
		},
		getNasaAPOD: function () {
			axios.get('/api/nasa')
				.then((response) => {
					this.background = `background-image: url("${response.data.hdurl}")`
				})
				.catch((err) => {
					if (this.env === 'development') console.log(err)
				})
		},
		getUnsplash: function () {
			const unsplash = new Unsplash({
				applicationId: process.env.UNSPLASH_ACCESS,
				secret: process.env.UNSPLASH_SECRET,
				callbackUrl: process.env.CALLBACK_URL
			})
			unsplash.photos.getRandomPhoto()
				.then(toJson)
				.then((unsplashResp) => {
					this.background = `background-image: url("${unsplashResp.urls.regular}")`
				})
		},
		getPexels: function () {
			if (this.imageList.length === 0) {
				this.page++
				axios.get(`https://api.pexels.com/v1/curated?per_page=${this.perPage}&page=${this.page}`, {
					headers: { Authorization: process.env.PEXELS_KEY }
				})
					.then((response) => {
						for (let i = 0; i < response.data.photos.length; i++) {
							this.imageList.push(response.data.photos[i].src.medium)
						}
						this.lastImage = this.imageList.shift()
						this.background = `background-image: url("${this.lastImage}")`
					})
					.catch((err) => {
						if (this.env === 'development') console.log(err)
					})
					.then(() => {
					// save current images array state
						this.saveState()
					})
			} else {
				// remove current image from array and display it
				this.lastImage = this.imageList.shift()
				this.background = `background-image: url("${this.lastImage}")`
			}
		},
		getMeta: function () {
			const imageElement = document.getElementById('backgroundImage')
			// let imageBlur = document.getElementById('backgroundImageBlur')
			const img = new Image()
			let degr = 0
			img.addEventListener('load', function () {
				EXIF.getData(this, function () {
					const orientation = EXIF.getTag(this, 'Orientation')

					switch (orientation) {
					case 1:
					case 2:
						degr = 0
						break
					case 3:
					case 4:
						degr = 180
						break
					case 5:
					case 6:
						degr = 90
						break
					case 7:
					case 8:
						degr = 270
						break
					default:
						degr = 0
					}
					imageElement.style.transform = `rotate(${degr}deg)`
					// rotating blurred bgr makes it the same size, and "CSS: cover" doesn't seem to work as expected
					// imageBlur.style.transform = "rotate("+degr+"deg)"
				})
			})
			img.src = `/api/background/${this.imageSrc}`
		}
	}
}
</script>

<style scoped>
#backgroundImage, #backgroundImageBlur {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
}

#backgroundImageBlur {
	-webkit-filter: blur(10px);
	-moz-filter: blur(10px);
	-o-filter: blur(10px);
	-ms-filter: blur(10px);
	filter: blur(10px);
	background-attachment: fixed;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
	/*
	image-orientation: from-image;
	*/
}

#backgroundImage {
	display: block;
	margin: auto;
	max-width: 100vw;
	max-height: 100vh;
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
	/* transform-origin: top left; */
}
.buttons {
	position: fixed;
	bottom: 0.5rem;
	right: 0.5rem;
	z-index: 10;
}
</style>
