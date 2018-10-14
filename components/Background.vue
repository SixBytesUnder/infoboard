<template>
  <section class="container">
    <div
      id="backgroundImageBlur" 
      :style="background"/>
    <div 
      id="backgroundImage" 
      :style="background"/>

    <div 
      v-if="enableButtons === true" 
      class="btn-group buttons">
      <button 
        :disabled="disableButtons" 
        class="btn btn-outline-dark" 
        @click="getBackground('image')">{{ nextimage }}</button>
      <button 
        :disabled="disableButtons" 
        class="btn btn-outline-dark" 
        @click="getBackground('folder')">{{ nextfolder }}</button>
    </div>
  </section>
</template>

<script>
import axios from 'axios'
import EXIF from 'exif-js'

export default {
  data: function() {
    return {
      // TODO: display only one image proded in SINGLE_IMAGE - this should disable any intervals
      singleImage: false,
      imageInterval: process.env.IMAGE_INTERVAL,
      nasa: false,
      background: '',
      imageSrc: '',
      imageList: [],
      enableButtons: true,
      disableButtons: false,
      nextimage: 'image',
      nextfolder: 'folder',
      // used to tell the backend what to show next
      lastImage: ''
    }
  },
  mounted() {
    this.singleImage = process.env.SINGLE_IMAGE === 'true' ? true : false
    this.enableButtons = process.env.NAV_BUTTONS === 'true' ? true : false
    this.nasa = process.env.NASA_APOD === 'true' ? true : false
    if (this.singleImage === true) {
      this.getBackground()
    } else if (this.nasa === true) {
      this.getNasaAPOD()
      this.interval = setInterval(this.getNasaAPOD, 1000 * 60 * 60)
    } else {
      this.loadState()
      this.interval = setInterval(this.getBackground, this.imageInterval * 1000)
      this.getBackground()
    }
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    saveState () {
      let savedImageList

      try {
        savedImageList = JSON.stringify(this.imageList)
        localStorage.removeItem('infoboardBgrState')
        localStorage.setItem('infoboardBgrState', savedImageList)
      } catch (err) {
        if (this.env == 'development') console.log(e)
      }
    },
    loadState () {
      let savedImageList

      try {
        savedImageList = localStorage.getItem('infoboardBgrState')
        if (savedImageList !== null) {
          this.imageList = JSON.parse(savedImageList)
        }
      } catch (err) {
        if (this.env == 'development') console.log(e)
      }
    },
    getBackground: function (param) {
      if (param == 'image') {
        this.disableButtons = true
        clearInterval(this.interval)
      } else if (param == 'folder') {
        this.disableButtons = true
        this.imageList = []
        clearInterval(this.interval)
      }
      this.nextimage = '...'
      this.nextfolder = '...'

      if (this.imageList.length == 0) {
        // get a batch of images
        axios.get(`/api/backgrounds/${this.lastImage}`)
        .then(response => {
          this.imageList = response.data
          this.lastImage = this.imageList.shift()
          // console.log(this.imageList)
          this.imageSrc = encodeURIComponent(this.lastImage)
          this.background = `background-image: url("/api/background/${this.imageSrc}")`
          this.getMeta()
          // get buttons back to normal
          this.nextimage = 'image'
          this.nextfolder = 'folder'
          this.disableButtons = false
        })
        .catch(e => {
          if (this.env == 'development') console.log(e)
        })
      } else {
        // remove current image from array and display it
        this.lastImage = this.imageList.shift()
        this.imageSrc = encodeURIComponent(this.lastImage)
        this.background = `background-image: url("/api/background/${this.imageSrc}")`
        this.getMeta()
        // get buttons back to normal
        this.nextimage = 'image'
        this.nextfolder = 'folder'
        this.disableButtons = false
      }

      // save current images array state
      this.saveState()

      if (param == 'image' || param == 'folder') {
        this.interval = setInterval(this.getBackground, 60000)
      }
    },
    getNasaAPOD: function() {
      axios.get('/api/nasa')
      .then(response => {
        this.background = `background-image: url("${response.data.hdurl}")`
      })
      .catch(e => {
        if (this.env == 'development') console.log(e)
      })
    },
    getMeta: function () {
      let imageElement = document.getElementById('backgroundImage')
      // let imageBlur = document.getElementById('backgroundImageBlur')
      let img = new Image()
      let degr = 0
      img.addEventListener("load", function() {
        EXIF.getData(this, function() {
          var orientation = EXIF.getTag(this, "Orientation")

          switch(orientation) {
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
}
</style>
