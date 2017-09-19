export default [
  {
    path: '/',
    name: 'root',
    component: require('@/views/Root')
  },
  {
    path: '/boot',
    name: 'boot',
    component: require('@/views/Boot')
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
