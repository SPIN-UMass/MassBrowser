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
    path: '/register',
    name: 'register',
    component: require('@/views/Register').default
  },
  {
    path: '/browser-integration',
    name: 'browser-integration',
    component: require('@/views/BrowserIntegration').default
  },

  {
    path: '/client',
    name: 'index',
    component: require('@/views/Index').default,
    children: [
      {
        path: '/',
        component: require('@/views/Home').default,
        name: 'home'
      },
      {
        path: '/client/websites',
        component: require('@/views/websites/WebsitesView').default,
        name: 'websites'
      },
      {
        path: '/client/feedback',
        name: 'feedback',
        component: require('@common/views/Feedback').default
      },
      {
        path: '/client/settings',
        component: require('@/views/settings/SettingsView').default,
        name: 'settings',
        children: [
          { path: '/client/settings', redirect: '/client/settings/general' },
          {
            path: '/client/settings/general',
            name: 'settings-general',
            component: require('@/views/settings/GeneralSettings').default
          },
          {
            path: '/client/settings/websites',
            name: 'settings-websites',
            component: require('@/views/settings/WebsiteSettings').default
          }
        ]
      },
      {
        path: '/client/stats',
        component: require('@/views/stats/statsView').default,
        name: 'debug',
        children: [
          { path: '/client/stats', redirect: '/client/stats/connections' },
          {
            path: '/client/stats/connections',
            name: 'stats-connections',
            component: require('@/views/stats/Connections.vue').default
          },
          {
            path: '/client/stats/sessions',
            name: 'stats-sessions',
            component: require('@/views/stats/Sessions.vue').default
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
