import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import VueRouter from 'vue-router'
import VueMask from 'v-mask'
// import Vuex from 'vuex'

import Promise from 'bluebird'
import ToggleButton from 'vue-js-toggle-button'

// import storeConfig from '@/store'
// import { initializeStore } from '@utils/store'

// import '@assets/font-awesome/css/font-awesome.min.css'
import '@assets/font-awesome/css/fa-svg-with-js.css'
import '@assets/font-awesome/js/fontawesome.min.js'
import '@assets/font-awesome/js/fa-solid.min.js'
import '@assets/bootstrap/css/bootstrap.min.css'
import '@assets/nifty/nifty.min.css'
import '@assets/fonts/neuropol.ttf'

import App from '@common/views/App'

export function initializeRendererProcess(routes) {
  // Overwrite native Promise implementation with Bluebird's
  window.Promise = Promise;

  Vue.use(Electron)
  Vue.use(Resource)
  Vue.use(VueRouter)
  Vue.use(VueMask)
  Vue.use(ToggleButton)
  // Vue.use(Vuex)

  // initializeStore(storeConfig)
  
  Vue.config.debug = true

  const router = new VueRouter({
    scrollBehavior: () => ({ y: 0 }),
    routes
  })
  
  /* eslint-disable no-new */
  // var options = Object.assign({router}, App)
  var options = {
    router,
    render: h => h(App)
  }
  new Vue(options).$mount('#app')
}
