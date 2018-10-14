<template>
  <div class="col">
    <div>
      <p class="row time display-1 px-2 withBackground">{{ time }}</p>
    </div>
    <div class="row mt-2">
      <p class="h4 px-2 py-1 withBackground">{{ date }}</p>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  data: function() {
    return {
      time: moment().format('HH:mm:ss'),
      date: moment().format('dddd, Do MMMM YYYY'),
      moment: moment
    }
  },
  mounted() {
    this.interval = setInterval(this.updateTime, 1000)
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    updateTime () {
      this.time = moment().format('HH:mm:ss')
      this.date = moment().format('dddd, Do MMMM YYYY')
    }
  }
}
</script>

<style scoped>
@media (max-width: 575.98px) {
  .time {
    font-size: 4rem;
  }
}
</style>
