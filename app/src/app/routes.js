export default [
  // {
  //   path: '/',
  //   name: 'landing-page',
  //   component: require('~/client/views/LandingPageView')
  // },
  {
    path: '/',
    name: 'yaler-home',
    component: require('~/client/views/YalerHome')
  },
  {
    path: '*',
    redirect: '/'
  }
]
