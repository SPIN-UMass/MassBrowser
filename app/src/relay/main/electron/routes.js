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
    component: require('@common/views/Start')
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
        path: '/relay/settings',
        component: require('@/views/settings/SettingsView'),
        name: 'settings',
        children: [
          { path: '/relay/settings', redirect: '/relay/settings/network' },
          {
            path: '/relay/settings/network',
            name: 'settings-network',
            component: require('@/views/settings/NetworkSettingsView')
          },
          {
            path: '/relay/settings/categories',
            name: 'settings-categories',
            component: require('@/views/settings/CategorySettingsView')
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
