export default [
  {
    path: '/',
    name: 'root',
    component: require('@/views/Root')
  },
  {
    path: '/boot',
    name: 'boot',
    component: require('@common/views/Boot')
  },
  {
    path: '/start',
    name: 'start',
    component: require('@/views/Start')
  },
  {
    path: '/relay',
    name: 'relay',
    component: require('@/views/Index'),
    children: [
      {
        path: '/relay',
        component: require('@/views/Home'),
        name: 'home'
      },
      {
        path: '/relay/clients',
        component: require('@/views/clients/ClientsView'),
        name: 'clients'
      },
      {
        path: '/relay/feedback',
        name: 'feedback',
        component: require('@common/views/Feedback')
      },
      {
        path: '/relay/settings',
        component: require('@/views/settings/SettingsView'),
        name: 'settings',
        children: [
          { path: '/relay/settings', redirect: '/relay/settings/general' },
          {
            path: '/relay/settings/general',
            name: 'settings-general',
            component: require('@/views/settings/GeneralSettings')
          },
          {
            path: '/relay/settings/network',
            name: 'settings-network',
            component: require('@/views/settings/NetworkSettings')
          },
          {
            path: '/relay/settings/categories',
            name: 'settings-categories',
            component: require('@/views/settings/CategorySettings')
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
