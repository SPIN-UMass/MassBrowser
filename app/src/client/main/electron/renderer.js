import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import VueRouter from 'vue-router'
import VueMask from 'v-mask'
import Promise from 'bluebird'
import ToggleButton from 'vue-js-toggle-button'


import routes from './routes'

import { Raven, RavenVue } from '@utils/raven'
import config from '@utils/config'
import {initializeLogging, warn} from '@utils/log'

import '@assets/font-awesome/css/font-awesome.min.css'
import '@assets/bootstrap/css/bootstrap.min.css'
import '@assets/nifty/nifty.min.css'

// Overwrite native Promise implementation with Bluebird's
window.Promise = Promise;

Vue.use(Electron)
Vue.use(Resource)
Vue.use(VueRouter)
Vue.use(VueMask)
Vue.use(ToggleButton)

Vue.config.debug = true

config.applicationInterface = 'electron'
initializeLogging()

if (config.sentry.enabled) {
  Raven.smartConfig()
  .addPlugin(RavenVue, Vue)
  .install()
} else {
  warn('Sentry is disabled, not using sentry')
}

const router = new VueRouter({
  scrollBehavior: () => ({ y: 0 }),
  routes
})


import App from '@/views/App'
/* eslint-disable no-new */
// var options = Object.assign({router}, App)
var options = {
  router,
  render: h => h(App)
}
new Vue(options).$mount('#app')
