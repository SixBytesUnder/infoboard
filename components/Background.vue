<template>
	<section class="container">
		<div
			id="backgroundImageBlur"
			:style="background"
			:class="magicMirror ? 'mm' : ''" />
		<div
			v-if="!magicMirror"
			id="backgroundImage"
			:style="background" />

		<div class="buttons text-right">
			<div
				v-if="showMetaData || magicMirror"
				class="p-2 mb-2 text-left withBackground">
				<p
					v-for="(value, key) in imageMetaData"
					:key="key">
					{{ key }}: {{ value }}
				</p>
			</div>
			<div class="btn-group">
				<button
					v-if="exifButton && !magicMirror && (imagesSource === 'single' || imagesSource === 'local')"
					class="btn btn-sm btn-outline-dark"
					@click="getExif">
					i
				</button>
				<button
					v-if="fullscreenEnabled && !magicMirror"
					class="btn btn-sm btn-outline-dark"
					@click="fullscreen">
					fullscreen
				</button>
				<button
					v-if="showNavButtons && !magicMirror"
					:disabled="disableButtons"
					class="btn btn-sm btn-outline-dark"
					@click="getNext('image')">
					{{ nextimage }}
				</button>
				<button
					v-if="enableFolderButton && showNavButtons && !magicMirror"
					:disabled="disableButtons"
					class="btn btn-sm btn-outline-dark"
					@click="getNext('folder')">
					{{ nextfolder }}
				</button>
			</div>
		</div>
	</section>
</template>

<script>
import axios from 'axios'
import { createApi } from 'unsplash-js'
import Flickr from 'flickr-sdk'
import ExifReader from 'exifreader'

export default {
	props: {
		weather: {
			type: Object,
			default() {
				return {}
			}
		}
	},
	data() {
		return {
			imageInterval: process.env.IMAGE_INTERVAL || 60,
			magicMirror: process.env.MAGIC_MIRROR === 'true',
			imagesSource: process.env.IMAGES_SOURCE === undefined || process.env.IMAGES_SOURCE === '' ? 'local' : process.env.IMAGES_SOURCE,
			exifButton: process.env.EXIF === 'true',
			nasa: false,
			background: '',
			imageSrc: '',
			imageList: [],
			page: 1,
			perPage: 10,
			showMetaData: false,
			imageMetaData: {},
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
		this.showNavButtons = process.env.NAV_BUTTONS === 'true'
		if (this.imagesSource === 'unsplash') {
			this.perPage = 30
		} else if (this.imagesSource === 'pexels') {
			this.perPage = 80
		}
		if (this.magicMirror === false) {
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
				this.getPexels()
				this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
			} else if (this.imagesSource === 'flickr') {
				this.enableFolderButton = false
				this.getFlickr()
				this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
			} else {
				this.loadState()
				this.getBackground()
				this.interval = setInterval(this.getBackground, this.imageInterval * 1000)
			}
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
				if (process.env.NODE_ENV === 'development') { console.log(err) }
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
				if (process.env.NODE_ENV === 'development') { console.log(err) }
			}
		},
		getExif(direct) {
			axios
				.get(`/api/background/${encodeURIComponent(this.lastImage)}`, {
					responseType: 'arraybuffer'
				})
				.then((response) => {
					const tags = ExifReader.load(response.data)
					const imageMetaData = {}
					imageMetaData.Make = (tags.Make || {}).description
					imageMetaData.Model = (tags.Model || {}).description
					imageMetaData.DateTime = (tags.DateTime || {}).description
					imageMetaData.ExposureTime = `${(tags.ExposureTime || {}).description} sec`
					imageMetaData.ExposureProgram = (tags.ExposureProgram || {}).description
					imageMetaData['F Number'] = (tags.FNumber || {}).description
					imageMetaData['Max Aperture'] = (tags.ApertureValue || {}).description
					imageMetaData.ISO = (tags.ISOSpeedRatings || {}).description
					imageMetaData.Flash = (tags.Flash || {}).description
					imageMetaData['Focal Length'] = (tags.FocalLength || {}).description
					imageMetaData['35mm Equivalent'] = (tags.FocalLengthIn35mmFilm || {}).description
					imageMetaData.ShutterSpeed = (tags.ShutterSpeedValue || {}).description
					imageMetaData.MeteringMode = (tags.MeteringMode || {}).description
					imageMetaData.PixelXDimension = (tags.PixelXDimension || {}).description
					imageMetaData.PixelYDimension = (tags.PixelYDimension || {}).description
					Object.keys(imageMetaData).forEach((key) => {
						if (imageMetaData[key]) {
							this.imageMetaData[key] = imageMetaData[key]
						}
					})
					// show meta data in UI
					if (direct) {
						this.showMetaData = !this.showMetaData
					}
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.error(err) }
				})
		},
		fullscreen() {
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
		getNext(param) {
			clearInterval(this.interval)
			if (this.imagesSource === 'unsplash') {
				this.getUnsplash()
				this.interval = setInterval(this.getUnsplash, this.imageInterval * 1000)
			} else if (this.imagesSource === 'pexels') {
				this.getPexels()
				this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
			} else if (this.imagesSource === 'flickr') {
				this.getFlickr()
				this.interval = setInterval(this.getPexels, this.imageInterval * 1000)
			} else {
				this.getBackground(param)
				this.getExif(false)
			}
		},
		pickImage() {
			// remove current image from array and display it
			this.lastImage = this.imageList.shift()
			this.imageSrc = encodeURIComponent(this.lastImage)
			this.background = `background-image: url("/api/background/${this.imageSrc}")`
			// get buttons back to normal
			this.nextimage = 'image'
			this.nextfolder = 'folder'
			this.disableButtons = false
		},
		async getBackground(param) {
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
						if (process.env.NODE_ENV === 'development') { console.log(err) }
					})
			} else {
				this.pickImage()
			}

			// save current images array state
			this.saveState()

			if (param === 'image' || param === 'folder') {
				this.interval = setInterval(this.getBackground, this.imageInterval * 1000)
			}
		},
		getNasaAPOD() {
			axios.get('/api/nasa')
				.then((response) => {
					if (response.data.media_type === 'image') {
						this.background = `background-image: url("${response.data.hdurl}")`
					} else {
						const filePath = require('@/assets/images/nasa.jpg')
						this.background = `background-image: url("${filePath}")`
					}
				})
				.catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				})
		},
		getUnsplash() {
			const unsplash = createApi({
				accessKey: process.env.UNSPLASH_ACCESS,
				secret: process.env.UNSPLASH_SECRET,
				callbackUrl: process.env.CALLBACK_URL
			})
			if (this.imageList.length === 0) {
				if (process.env.WEATHER === 'true' && process.env.UNSPLASH_WEATHER_TAGGED === 'true') {
					unsplash.search.getPhotos({
						query: `weather ${this.weather.weather_code.value.split('_').join(' ')}`,
						page: this.page,
						perPage: this.perPage
					})
						.then((unsplashResp) => {
							unsplashResp.response.results.forEach((photo) => {
								this.imageList.push(photo.urls.regular)
							})
							this.lastImage = this.imageList.shift()
							this.background = `background-image: url("${this.lastImage}")`
							this.saveState()
							this.page++
						})
						.catch((err) => {
							if (process.env.NODE_ENV === 'development') { console.log(err) }
						})
				} else {
					unsplash.photos.getRandom({
						count: this.perPage
					})
						.then((unsplashResp) => {
							unsplashResp.response.forEach((photo) => {
								this.imageList.push(photo.urls.regular)
							})
							this.lastImage = this.imageList.shift()
							this.background = `background-image: url("${this.lastImage}")`
							this.saveState()
						})
						.catch((err) => {
							if (process.env.NODE_ENV === 'development') { console.log(err) }
						})
				}
			} else {
				// remove current image from array and display it
				this.lastImage = this.imageList.shift()
				this.background = `background-image: url("${this.lastImage}")`
			}
		},
		getPexels() {
			if (this.imageList.length === 0) {
				let url
				if (process.env.WEATHER === 'true' && process.env.PEXELS_WEATHER_TAGGED === 'true') {
					url = `https://api.pexels.com/v1/search?per_page=${this.perPage}&page=${this.page}&query=weather%20${this.weather.weather_code.value.split('_').join('%20')}`
				} else {
					url = `https://api.pexels.com/v1/curated?per_page=${this.perPage}&page=${this.page}`
				}
				axios.get(url, {
					headers: { Authorization: process.env.PEXELS_KEY }
				})
					.then((response) => {
						for (let i = 0; i < response.data.photos.length; i++) {
							this.imageList.push(response.data.photos[i].src.large)
						}
						this.lastImage = this.imageList.shift()
						this.background = `background-image: url("${this.lastImage}")`
					})
					.catch((err) => {
						if (process.env.NODE_ENV === 'development') { console.log(err) }
					})
					.then(() => {
						// save current images array state
						this.saveState()
					})
				this.page++
			} else {
				// remove current image from array and display it
				this.lastImage = this.imageList.shift()
				this.background = `background-image: url("${this.lastImage}")`
				this.page = 1
			}
		},
		getFlickr() {
			if (this.imageList.length === 0) {
				const flickr = new Flickr(process.env.FLICKR_API_KEY)
				flickr.photos.search({
					tags: `${this.weather.weather_code.value.split('_').join(',')}`,
					tag_mode: 'all',
					page: this.page
				}).then((response) => {
					for (let i = 0; i < response.body.photos.photo.length; i++) {
						const img = response.body.photos.photo[i]
						this.imageList.push(`https://farm${img.farm}.staticflickr.com/${img.server}/${img.id}_${img.secret}_b.jpg`)
					}
					this.lastImage = this.imageList.shift()
					this.background = `background-image: url("${this.lastImage}")`
				}).catch((err) => {
					if (process.env.NODE_ENV === 'development') { console.log(err) }
				}).then(() => {
					// save current images array state
					this.saveState()
				})
				this.page++
			} else {
				// remove current image from array and display it
				this.lastImage = this.imageList.shift()
				this.background = `background-image: url("${this.lastImage}")`
				this.page = 1
			}
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
	image-orientation: from-image;
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
}

#backgroundImageBlur.mm {
	background: none;
	background-color: #000;
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
.buttons p {
	font-size: 0.75rem;
	margin: 0;
}
</style>
