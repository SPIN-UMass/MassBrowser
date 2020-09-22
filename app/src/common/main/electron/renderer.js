import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
import VueRouter from 'vue-router'
import VueMask from 'v-mask'
import VueI18n from 'vue-i18n'
import ToggleButton from 'vue-js-toggle-button'
import vSelect from 'vue-select'
// import { initializeStore } from '@utils/store'

import '@assets/font-awesome/css/font-awesome.min.css'
import '@assets/bootstrap/css/bootstrap.min.css'
import '@assets/nifty/nifty.min.css'
import '@assets/fonts/neuropol.ttf'
import 'vue-select/dist/vue-select.css'

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
import { getService } from '@utils/remote'
import locales from '@utils/locales'

import App from '@common/views/App'

export async function initializeRendererProcess (routes) {
  Vue.component('icon', Icon)
  Vue.component('v-select', vSelect)
  Vue.use(Electron)
  Vue.use(Resource)
  Vue.use(VueRouter)
  Vue.use(VueMask)
  Vue.use(VueI18n)
  Vue.use(ToggleButton)
  // // Vue.use(Vuex)
  
  console.log(routes)

  Vue.config.debug = true
  let lang = 'en'
  console.log(routes)
  const remoteStore = getService('store')
  await remoteStore.getState().then((remoteState) => {
    lang = remoteState.language || lang
  })

  const i18n = new VueI18n({
    locale: lang,
    fallbackLocale: 'en',
    messages: locales
  })

  const router = new VueRouter({
    scrollBehavior: () => ({ y: 0 }),
    routes: routes
  })

  // /* eslint-disable no-new */
  // var options = Object.assign({router}, App)
  var options = {    
    router,
    i18n,
    render: h => h(App)
  }
  new Vue(options).$mount('#app')
}