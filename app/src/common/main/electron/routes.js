export default [
  {
    path: '/',
    name: 'splash',
    component: require('@/views/Splash')
  },
  {
    path: '/boot',
    name: 'boot',
    component: require('@/views/Boot')
  },
  {
    path: '/browser-integration',
    name: 'browser-integration',
    component: require('~/client/views/BrowserIntegration')
  },
  {
    path: '/start',
    name: 'start',
    component: require('@/views/Start')
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
        component: require('@/views/WebsitesView'),
        name: 'websites'
      }
    ]
  },
  
  {
    path: '*',
    redirect: '/'
  }
]
