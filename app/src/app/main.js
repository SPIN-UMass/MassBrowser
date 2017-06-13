import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import Router from 'vue-router'

import App from './App'
import routes from './routes'

import { Raven, RavenVue } from '~/utils/raven'

import 'assets/font-awesome/css/font-awesome.min.css'
import 'assets/bootstrap/css/bootstrap.min.css'
import 'assets/nifty/nifty.min.css'


Vue.use(Electron)
Vue.use(Resource)
Vue.use(Router)


Vue.config.debug = true

Raven
  .config('https://70f65517a1af4506b31f8e4e8ce9ddc7@sentry.yaler.co/3', {
    release: 'f3e5bbe933ad663639235dafbd99b80aefeef4ab'
  })
  .addPlugin(RavenVue, Vue)
  .install()
  
const router = new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes
})

/* eslint-disable no-new */
var options = Object.assign({router}, App)
new Vue(options).$mount('#app')
