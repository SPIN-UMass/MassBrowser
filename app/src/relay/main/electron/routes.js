

import Boot from '@common/views/Boot'
import Feedback from '@common/views/Feedback'

import Root from '@/views/Root'
import Start from '@/views/Start'
import Index from '@/views/Index'
import Home from '@/views/Home'
import ClientsView from '@/views/clients/ClientsView'

import SettingsView from '@/views/settings/SettingsView'
import GeneralSettings from '@/views/settings/GeneralSettings'
import NetworkSettings from '@/views/settings/NetworkSettings'
import CategorySettings from '@/views/settings/CategorySettings'

export default [

  {
    path: '/',
    name: 'root',
    component:  Root
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
    path: '/relay',
    name: 'relay',
    component: Index,
    children: [
      {
        path: '/relay',
        component: Home,
        name: 'home'
      },
      {
        path: '/relay/clients',
        component: ClientsView,
        name: 'clients'
      },
      {
        path: '/relay/feedback',
        name: 'feedback',
        component: Feedback
      },
      {
        path: '/relay/settings',
        component: SettingsView,
        name: 'settings',
        children: [
          { path: '/relay/settings', redirect: '/relay/settings/general' },
          {
            path: '/relay/settings/general',
            name: 'settings-general',
            component: GeneralSettings
          },
          {
            path: '/relay/settings/network',
            name: 'settings-network',
            component: NetworkSettings
          },
          {
            path: '/relay/settings/categories',
            name: 'settings-categories',
            component: CategorySettings
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
