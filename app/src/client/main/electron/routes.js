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
    path: '/register',
    name: 'register',
    component: require('@/views/Register')
  },
  {
    path: '/browser-integration',
    name: 'browser-integration',
    component: require('@/views/BrowserIntegration')
  },

  {
    path: '/client',
    name: 'index',
    component: require('@/views/Index'),
    children: [
      {
        path: '/',
        component: require('@/views/Home'),
        name: 'home'
      },
      {
        path: '/client/websites',
        component: require('@/views/websites/WebsitesView'),
        name: 'websites'
      },
      {
        path: '/client/feedback',
        name: 'feedback',
        component: require('@common/views/Feedback')
      },
      {
        path: '/client/settings',
        component: require('@/views/settings/SettingsView'),
        name: 'settings',
        children: [
          { path: '/client/settings', redirect: '/client/settings/general' },
          {
            path: '/client/settings/general',
            name: 'settings-general',
            component: require('@/views/settings/GeneralSettings')
          },
          {
            path: '/client/settings/websites',
            name: 'settings-websites',
            component: require('@/views/settings/WebsiteSettings')
          }
        ]
      },
      {
        path: '/client/stats',
        component: require('@/views/stats/StatsView'),
        name: 'debug',
        children: [
          { path: '/client/stats', redirect: '/client/stats/connections' },
          {
            path: '/client/stats/connections',
            name: 'stats-connections',
            component: require('@/views/stats/Connections.vue')
          },
          {
            path: '/client/stats/sessions',
            name: 'stats-sessions',
            component: require('@/views/stats/Sessions.vue')
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
