

import Vue from 'vue/dist/vue'
import VueRouter from 'vue-router/dist/vue-router'

import FirefoxComponent from './views/firefox'
import StartComponent from './views/start'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    { path: '/', component: StartComponent },
    { path: '/firefox', component: FirefoxComponent }
  ]
})

var app = new Vue({
  el: '#app',
  router: router,
  components: {
    FirefoxComponent,
    StartComponent
  },
  data: {

  },
  created() {
    // this.browser = getBrowser()

  }
})
