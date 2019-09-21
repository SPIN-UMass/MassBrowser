export default [
  {
    path: '/',
    name: 'root',
    component: require('@/views/Root').default
  },
  {
    path: '/boot',
    name: 'boot',
    component: require('@common/views/Boot').default
  },
  {
    path: '/start',
    name: 'start',
    component: require('@/views/Start').default
  },
  {
    path: '/relay',
    name: 'relay',
    component: require('@/views/Index').default,
    children: [
      {
        path: '/relay',
        component: require('@/views/Home').default,
        name: 'home'
      },
      {
        path: '/relay/clients',
        component: require('@/views/clients/ClientsView').default,
        name: 'clients'
      },
      {
        path: '/relay/feedback',
        name: 'feedback',
        component: require('@common/views/Feedback').default
      },
      {
        path: '/relay/settings',
        component: require('@/views/settings/SettingsView').default,
        name: 'settings',
        children: [
          { path: '/relay/settings', redirect: '/relay/settings/general' },
          {
            path: '/relay/settings/general',
            name: 'settings-general',
            component: require('@/views/settings/GeneralSettings').default
          },
          {
            path: '/relay/settings/network',
            name: 'settings-network',
            component: require('@/views/settings/NetworkSettings').default
          },
          {
            path: '/relay/settings/categories',
            name: 'settings-categories',
            component: require('@/views/settings/CategorySettings').default
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
