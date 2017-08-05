import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import VueRouter from 'vue-router'
import VueMask from 'v-mask'
import Promise from 'bluebird'
import ToggleButton from 'vue-js-toggle-button'

import '@assets/font-awesome/css/font-awesome.min.css'
import '@assets/bootstrap/css/bootstrap.min.css'
import '@assets/nifty/nifty.min.css'

import App from '@common/views/App'

export function initializeRendererProcess(routes) {
  // Overwrite native Promise implementation with Bluebird's
  window.Promise = Promise;

  Vue.use(Electron)
  Vue.use(Resource)
  Vue.use(VueRouter)
  Vue.use(VueMask)
  Vue.use(ToggleButton)

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
