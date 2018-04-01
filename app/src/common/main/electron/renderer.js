import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import VueRouter from 'vue-router'
import VueMask from 'v-mask'
// import Vuex from 'vuex'

import ToggleButton from 'vue-js-toggle-button'

// import storeConfig from '@/store'
// import { initializeStore } from '@utils/store'

import '@assets/font-awesome/css/font-awesome.min.css'
import '@assets/bootstrap/css/bootstrap.min.css'
import '@assets/nifty/nifty.min.css'
import '@assets/fonts/neuropol.ttf'

import Icon from 'vue-awesome/components/Icon'
import 'vue-awesome/icons/globe'
import 'vue-awesome/icons/cogs'
import 'vue-awesome/icons/signal'
import 'vue-awesome/icons/comment'
import 'vue-awesome/icons/times'
import 'vue-awesome/icons/times-circle'
import 'vue-awesome/icons/check-circle'
import 'vue-awesome/icons/question-circle'
import 'vue-awesome/icons/thumbs-up'
import 'vue-awesome/icons/thumbs-down'
import 'vue-awesome/icons/firefox'


import App from '@common/views/App'

export function initializeRendererProcess(routes) {
  Vue.use(Electron)
  Vue.use(Resource)
  Vue.use(VueRouter)
  Vue.use(VueMask)
  Vue.use(ToggleButton)
  // Vue.use(Vuex)

  Vue.component('icon', Icon)

  
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
