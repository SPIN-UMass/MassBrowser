export default [
  {
    path: '/',
    name: 'splash',
    component: require('@common/views/Splash')
  },
  {
    path: '/boot',
    name: 'boot',
    component: require('@/views/Boot')
  },
  {
    path: '/start',
    name: 'start',
    component: require('@common/views/Start')
  },
  {
    path: '/relay',//
    name: 'relay',
    component: require('@/views/Index'),
    children: [
      {
        path: '/relay/settings',
        component: require('@/views/SettingsView'),
        name: 'relay-settings'

      },
      {
        path: '/relay/categories',
        component: require('@/views/CategoriesView'),
        name: 'relay-categories'

      }
    ]

  },
  {
    path: '*',
    redirect: '/'
  }
]
