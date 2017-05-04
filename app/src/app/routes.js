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
    path: '/yaler',
    name: 'yaler-home',
    component: require('~/client/views/YalerHome')
  },
  {
    path: '*',
    redirect: '/'
  }
]
