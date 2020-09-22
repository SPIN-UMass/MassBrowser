
import Boot from '@common/views/Boot'
import Feedback from '@common/views/Feedback'

import Root from '@/views/Root'
import Start from '@/views/Start'
import Index from '@/views/Index'
import Register from '@/views/Register'
import Home from '@/views/Home'
import BrowserIntegration from '@/views/BrowserIntegration'
import WebsiteSettings from '@/views/settings/WebsiteSettings'
import Connections from '@/views/stats/Connections.vue'
import Sessions from '@/views/stats/Sessions.vue'
import WebsitesView from '@/views/websites/WebsitesView'
import SettingsView from '@/views/settings/SettingsView'
import GeneralSettings from '@/views/settings/GeneralSettings'
import StatsView from '@/views/stats/StatsView'


export default [
  {
    path: '/',
    name: 'root',
    component: Root
  },
  {
    path: '/boot',
    name: 'boot',
    component: Boot
  },
  {
    path: '/start',
    name: 'start',
    component: Start
  },
  {
    path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/browser-integration',
    name: 'browser-integration',
    component: BrowserIntegration
  },

  {
    path: '/client',
    name: 'index',
    component: Index,
    children: [
      {
        path: '/',
        component: Home,
        name: 'home'
      },
      {
        path: '/client/websites',
        component: WebsitesView,
        name: 'websites'
      },
      {
        path: '/client/feedback',
        name: 'feedback',
        component: Feedback
      },
      {
        path: '/client/settings',
        component: SettingsView,
        name: 'settings',
        children: [
          { path: '/client/settings', redirect: '/client/settings/general' },
          {
            path: '/client/settings/general',
            name: 'settings-general',
            component: GeneralSettings
          },
          {
            path: '/client/settings/websites',
            name: 'settings-websites',
            component: WebsiteSettings
          }
        ]
      },
      {
        path: '/client/stats',
        component: StatsView,
        name: 'debug',
        children: [
          { path: '/client/stats', redirect: '/client/stats/connections' },
          {
            path: '/client/stats/connections',
            name: 'stats-connections',
            component: Connections
          },
          {
            path: '/client/stats/sessions',
            name: 'stats-sessions',
            component: Sessions
          }
        ]
      }
    ]
  },

  {
    path: '*',
    redirect: '/'
  }
]
