<template>
  <div v-if="enable === 'true'">
    <div class="row">
      <div class="item col mx-2">
        <div class="media px-2 py-2 withBackground">
          <img 
            id="bus-icon" 
            class="align-self-start" 
            src="/images/bus.svg" 
            alt="Bus" 
            @click="toggleBuses">
          <div 
            v-if="showBuses" 
            class="media-body mx-2">
            <p 
              v-for="(bus, index) in buses" 
              :key="index">
              <span class="badge badge-light mr-1">{{ index }}</span>
              <span 
                v-for="(time, index) in bus" 
                :key="index" 
                class="align-self-middle">
                <span>{{ time }}m</span><span v-if="index+1 < bus.length">, </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="item col mx-2 mt-2">
        <div 
          v-if="showTubeIcon" 
          id="tube-icon" 
          class="px-2 py-2 withBackground">
          <img 
            class="bus-icon" 
            src="/images/tube.svg" 
            alt="Tube" 
            @click="toggleTube">
        </div>
        <div 
          v-if="showTube" 
          class="tube-data px-2 py-2 withBackground" 
          @click="toggleTube">
          <div 
            v-for="(line, idx) of tube" 
            :key="idx" 
            class="row">
            <div class="col">
              <span 
                :class="line.id" 
                class="badge w-100">{{ line.name }}</span>
            </div>
            <div 
              class="col align-items-center" 
              style="white-space: nowrap">
              {{ line.lineStatuses.statusSeverityDescription }}
            </div>
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
      enable: process.env.TFL,
      appId: process.env.TFL_APP_ID,
      appKey: process.env.TFL_APP_KEY,
      busStops: process.env.TFL_BUS_STOPS.split(','),
      statusLines: process.env.TFL_STATUS,
      showBuses: false,
      showTube: false,
      showTubeIcon: true,
      busesTemp: {},
      buses: {},
      tube: {},
      errors: []
    }
  },
  mounted () {
    this.getTfLStatus()
    this.interval = setInterval(this.getTfLStatus, 60000)
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  methods: {
    toggleBuses() {
      this.showBuses = !this.showBuses
    },
    toggleTube() {
      this.showTube = !this.showTube
      this.showTubeIcon = !this.showTubeIcon
    },
    getTfLStatus () {
      // clear existing buses info
      this.busesTemp = {}
      this.buses = {}
      for (let line of this.busStops) {
        this.getBus(line)
      }
      // tube line status
      this.getTube()
    },
    async getBus (busStop) {
      await axios.get(`https://api.tfl.gov.uk/StopPoint/${busStop}/Arrivals?app_id=${this.appId}&app_key=${this.appKey}`)
      .then((res) => {
        if (res.data.length > 0 ) {
          // let bus = {}
          for (var i = 0; i < res.data.length; i++) {
            let timetable = ''

            if (typeof res.data[i].timeToStation == 'number') {
              timetable = Math.round(res.data[i].timeToStation / 60)
            } else if (res.data[i].timeToStation <= 0.2) {
              timetable = 'Due'
            } else {
              timetable = res.data[i].timeToStation
            }

            if (this.busesTemp[res.data[i].lineName] == undefined) {
              this.busesTemp[res.data[i].lineName] = []
            }
            this.busesTemp[res.data[i].lineName].push(timetable)
            this.busesTemp[res.data[i].lineName].sort((a, b) => a - b)
          }
          // Note: Vue has problems updating parts of an array or object, that's why this is a returned local variable
          // return bus
        }
      }).then(() => {
        // console.log(this.busesTemp)
        this.buses = this.busesTemp
        // if (this.busStops.length === Object.keys(data).length) {
        //   this.buses = data
        // }
      }).catch(e => {
        if (this.env == 'development') console.log(e)
      })
    },
    async getTube () {
      await axios.get(`https://api.tfl.gov.uk/line/mode/${this.statusLines}/status?app_id=${this.appId}&app_key=${this.appKey}`)
      .then((res) => {
        if (res.status === 200) {
          for (var i = 0; i < res.data.length; i++) {
            this.tube[res.data[i].id] = {
              id: res.data[i].id,
              name: res.data[i].name
            }
            // iterate through statuses
            for (var j = 0; j < res.data[i].lineStatuses.length; j++) {
              let lineStatus = res.data[i].lineStatuses[j]
              this.tube[res.data[i].id].lineStatuses = {
                statusSeverity: lineStatus.statusSeverity,
                statusSeverityDescription: lineStatus.statusSeverityDescription
              }
            }
          }
        } else {
          this.errors.push(`TfL API error: ${res.message}`)
        }
      }).catch(e => {
        if (this.env == 'development') console.log(e)
      })
    }
  }
}
</script>

<style scoped>
#bus-icon, #tube-icon img {
  min-width: 10%;
  width: 4rem;
}
.bakerloo {
  background-color: #AE6118;
  color: #FFFFFF;
}
.central {
  background-color: #E41F1F;
  color: #FFFFFF;
}
.circle {
  background-color: #F8D42D;
  color: #113892;
}
.district {
  background-color: #007229;
  color: #FFFFFF;
}
.dlr {
  background-color: #00BBB4;
  color: #FFFFFF;
}
.hammersmith-city {
  background-color: #E899A8;
  color: #113892;
}
.jubilee {
  background-color: #686E72;
  color: #FFFFFF;
}
.metropolitan {
  background-color: #893267;
  color: #FFFFFF;
}
.northern {
  background-color: #000000;
  color: #FFFFFF;
}
.overground {
  background-color: #F86;
  color: #FFFFFF;
}
.london-overground {
  background-color: #e86a10;
  color: #000;
}
.piccadilly {
  background-color: #0450A1;
  color: #FFFFFF;
}
.tfl-rail {
  background-color: #0019a8;
  color: #FFFFFF;
}
.tram {
  background-color: #6c0;
  color: #FFFFFF;
}
.victoria {
  background-color: #009FE0;
  color: #FFFFFF;
}
.waterloo-city {
  background-color: #70C3CE;
  color: #113892;
}

@media (max-width: 575.98px) {
  .item {
    min-width: 90%;
  }
}
</style>
