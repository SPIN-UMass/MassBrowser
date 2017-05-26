export default [
  {
    path: '/',
    name: 'home',
    component: require('./views/Home')
  },
  {
    path: '/roleselect',
    name: 'roleSelect',
    component: require('./views/RoleSelect')
  },
  {
    path: '/client',
    name: 'client-index',
    component: require('~/client/views/Index'),
    children: [
      {
        path: 'home',
        component: require('~/client/views/Home')
      }
    ]
  },
  {
    path: '*',
    redirect: '/'
  }
]
