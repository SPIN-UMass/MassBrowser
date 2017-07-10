export default [
  {
    path: '/',
    name: 'index',
    component: require('./views/Index')
  },
  {
    path: '/start',
    name: 'start',
    component: require('./views/Start')
  },
  {
    path: '/roleselect',
    name: 'roleSelect',
    component: require('./views/RoleSelect')
  },
  {
    path: '/client',
    name: 'client',
    component: require('~/client/views/Index'),
    children: [
      {
        path: '/',
        component: require('~/client/views/Home'),
        name: 'client-home'
      },
      {
        path: '/client/websites',
        component: require('~/client/views/WebsitesView'),
        name: 'client-websites'
      }
    ]
  },
  {
    path: '/client-splash',
    name: 'client-splash',
    component: require('~/client/views/Splash')
  },
  {
    path: '/relay',
    name: 'relay',
    component: require('~/client/views/Index')
  },
  {
    path: '*',
    redirect: '/'
  }
]
