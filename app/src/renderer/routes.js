export default [
  {
    path: '/',
    name: 'landing-page',
    component: require('components/LandingPageView')
  },
  {
    path: '/yaler',
    name: 'yaler-home',
    component: require('components/Yaler/YalerHome')
  },
  {
    path: '*',
    redirect: '/'
  }
]
