<template lang='pug'>
    #page-firefox
        .tab-base.tab-stacked-left
            ul.nav.nav-tabs
                li(:class="{active: tab==='proxy'}")
                    a(v-on:click="tab='proxy'") Proxy Settings
                        i.step-status.text-danger.fa.fa-times-circle(v-if="!proxy.success")
                        i.step-status.text-success.fa.fa-check-circle(v-if="proxy.success")
                li(:class="{active: tab==='cert', disabled: !proxy.success}")
                    a(v-on:click="tab='cert'") Trust CA Certificate
                        i.step-status.text-danger.fa.fa-times-circle(v-if="!cert.success")
                        i.step-status.text-success.fa.fa-check-circle(v-if="cert.success")
                li( :class="{active: tab==='dnsCache', disabled: !proxy.success}")
                    a(v-on:click="tab='dnsCache'") Disable DNS Cache
                        i.step-status.text-danger.fa.fa-times-circle(v-if="!dnsCache.success")
                        i.step-status.text-success.fa.fa-check-circle(v-if="dnsCache.success")
            .tab-content
                .tab-pane.step-proxy(:class="{active: tab==='proxy', in: tab==='proxy'}")
                    .step-title.text-thin Proxy Settings
                    div(v-if="!proxy.success")
                        ol
                            li
                                | Set your browser proxy to use #[code SOCKS v5] proxy with host #[code localhost] and port #[code {{socksPort}}]
                            li Make sure the #[code Proxy DNS when using SOCKS v5] option is enabled
                            li Click on the button below the verify your settings

                        .control-containers
                            .text-primary.text-bold(v-if="proxy.success===null") Checking Proxy Settings...
                            .text-success.text-bold(v-if="proxy.success===true") Proxy settings are valid
                            .text-danger.text-bold(v-if="proxy.success===false && proxy.errorMessage") {{proxy.errorMessage}}
                            button.proxy-btn.btn.btn-primary(v-if="proxy.success!==null" v-on:click="checkProxySettings") Check Proxy Settings


                        .help-container
                            span.help(v-if="!proxy.helpEnabled" v-on:click="proxy.helpEnabled = true") Need Help? Click here to show step by step instructions.
                            .help-steps-container(v-if="proxy.helpEnabled")
                                .help-image(v-for="image in proxy.stepImages")
                                    img(width='400' :src="image")
                    div(v-if="proxy.success").text-center.pad-all
                        i.fa.fa-check-circle.fa-4x.text-success.mar-all
                        div
                            button.continue-btn.btn.btn-success.btn-rounded.mar-all(v-on:click="nextStep") Continue

                .tab-pane.step-cert(:class="{active: tab==='cert', in: tab==='cert'}")
                    .step-title.text-thin Trust CA Certificate
                    div(v-if="!cert.success")
                        p #[strong MassBrowser] requires your browser to trust a root CA Certificate. The certificate is generated locally and does not expose you to any security risks as long as it is kept within your machine.

                        .alert.alert-info
                            p This is a #[strong local certificate that does not pose any threat] to your confidentiality when you browse websites. The certifcate is generated and stored only on this machine, you #[strong must not] share it with anyone. Click #[strong here] to view the location of the stored certificate.
                            p You can remove the certificate at any time by going to your browser’s setting and searching for #[code MassBrowser]
                        p Follow the instructions below to install the certificate
                        ol
                            li Click on the #[code Install Certificate] button below
                            li(style='font-weight: bold') Select the #[code Trust this CA to identify websites] option and click OK
                        .help-steps-container.text-center
                            .help-image
                                img(width='300' :src="cert.image")
                        div.text-center.mar-all
                            button.cert-btn.btn.btn-success(v-on:click="installCert") Install Certificate

                    div(v-if="cert.success").text-center.pad-all
                        i.fa.fa-check-circle.fa-4x.text-success.mar-all
                        div
                            button.continue-btn.btn.btn-success.btn-rounded.mar-all(v-on:click="nextStep") Continue

                .tab-pane.fade(:class="{active: tab==='dnsCache', in: tab==='dnsCache'}")
                    .step-title.text-thin Disable DNS Cache
                    div(v-if="!dnsCache.success")
                        p The browser's DNS cache must be disabled for MassBrowser to work

                        ol
                            li In your URL bar enter #[code about:config]
                            li If a warning message appears click on #[code I accept the risk!] button
                            li Search for the key #[code network.dnsCacheExpiration] and change the value to #[code 0]
                            li Click on the button below test whether the change was successful
                        div.text-center.mar-all
                            button.cert-btn.btn.btn-primary(v-on:click="checkDNSCache") Check DNS Cache
                    div(v-if="dnsCache.success").text-center.pad-all
                        i.fa.fa-check-circle.fa-4x.text-success.mar-all
                        div
                            button.continue-btn.btn.btn-success.btn-rounded.mar-all(v-on:click="nextStep") Continue

                .tab-pane.fade(:class="{active: tab==='finish', in: tab==='finish'}")
                    .text-center.mar-all.pad-all
                        i.fa.fa-check-circle.fa-5x.text-success.mar-all
                        h4 You're good to go

</template>

<script>
  import axios from 'axios/dist/axios'
  import { ONBOARDING_DOMAIN, ONBOARDING_ADDRESS, NO_HOST_HANDLER_PORT, SOCKS_PORT } from '../config'

  let proxyStepImages = [
    require('../assets/images/proxy-step-1.png'),
    require('../assets/images/proxy-step-2.png'),
    require('../assets/images/proxy-step-3.png'),
    require('../assets/images/proxy-step-4.png'),
    require('../assets/images/proxy-step-5.png'),
    require('../assets/images/proxy-step-6.png')
  ]

  let certImage = require('../assets/images/cert.png')

  let steps = ['proxy', 'cert', 'dnsCache', 'finish']

  export default {
    data () {
      return {
        proxy: {
          success: null,
          errorMessage: null,
          helpEnabled: false,
          stepImages: proxyStepImages
        },
        cert: {
          success: null,
          pollCertValidation: false,
          checkIntervalStarted: false,
          image: certImage
        },
        dnsCache: {
          success: null
        },
        tab: 'proxy',
        socksPort: SOCKS_PORT
      }
    },
    created () {
      this.checkProxySettings(false)
        .then(() => {
          if (this.proxy.success) {
            this.nextStep()
            this.checkCert()
              .then(() => {
                if (this.cert.success && this.tab === 'cert') {
                  this.nextStep()
                }
              })

            this.checkDNSCache()
              .then(() => {
                if (this.dnsCache.success && this.tab === 'dnsCache') {
                  this.nextStep()
                }
              })
          }
        })
    },
    methods: {
      nextStep () {
        let next = steps.indexOf(this.tab) + 1
        this.tab = steps[next]
        if (this[this.tab] && this[this.tab].success) {
          return this.nextStep()
        }

        this.onTabChange(this.tab)
      },
      onTabChange () {
        if (this.tab === 'finish') {
          return axios.get(`http://${ONBOARDING_DOMAIN}/settings-complete`)
        } else if (this.tab === 'cert') {
          this.checkCert()
        } else if (this.tab === 'dnsCache') {
          this.checkDNSCache()
        }
      },
      checkProxySettings (showError = true) {
        return axios.get(`http://${ONBOARDING_DOMAIN}/check-proxy`)
          .then(response => {
            if (response.data === 'active') {
              this.proxy.success = true
              this.cert.pollCertValidation = true
            } else {
              if (showError) {
                this.proxy.errorMessage = 'Proxy settings not valid.'
              }
            }
          })
          .catch(e => {
            console.error(e)
            this.proxy.success = false
            if (showError) {
              this.proxy.errorMessage = 'Proxy settings not valid. Make sure the application is running.'
            }
          })
      },
      installCert () {
        console.log('Requesting certificate dialog')
        window.open(`http://${ONBOARDING_ADDRESS}/cert`, '_self')
        if (!this.cert.checkIntervalStarted) {
          this.cert.pollCertValidation = true
          this.cert.checkIntervalStarted = true
          setTimeout(this.checkCert, 2000)
        }
      },
      checkCert () {
        console.log('Checking Certificate')
        if (!this.proxy.success) {
          return new Promise((resolve, reject) => {
            this.cert.success = false
            resolve()
          })
        }
        return axios.get(`https://${ONBOARDING_DOMAIN}/`, { validateStatus: () => true })
          .then(response => {
            this.cert.success = true
            this.cert.pollCertValidation = false
          })
          .catch(e => {
            console.error(e)
            this.cert.success = false
          })
          .then(() => {
            if (this.cert.pollCertValidation) {
              setTimeout(this.checkCert, 2000)
            }
          })
      },
      checkDNSCache () {
        console.log('Checking DNS')
        if (!this.proxy.success) {
          return new Promise((resolve, reject) => {
            this.dnsCache.success = false
            resolve()
          })
        }

        /**
         * Send a request to a domain with the path '/ping'. If the DNS cache
         * is not disabled, the request will go through the proxy with an IP address
         * not the domain name, the proxy will send it to the no-host handler which
         * will respond to the /ping request with a 'pong'. So if a pong reply is received
         * it means the DNS cache is not disabled.
         */
        function testDNSCache () {
          return new Promise((resolve, reject) => {
            axios.get(`https://www.thecocktaildb.com/ping`, { validateStatus: () => true })
              .then(response => {
                if (response.data === 'pong') {
                  resolve(false)
                } else {
                  resolve(true)
                }
              })
              .catch(e => {
                console.error(e)
                resolve(false)
              })
          })
        }

        /**
         * The DNS cache disabling test will be successful first time
         * should check multiple times to make sure cache isn't working
         */
        function runMultipleTests (count, result) {
          return testDNSCache()
            .then(success => success ? (count >= 1 ? runMultipleTests(count - 1) : true) : false)
        }

        return runMultipleTests(3)
          .then(success => {
            this.dnsCache.success = success
          })
      }
    }
  }
</script>

<style lang='scss'>
    #page-firefox{
        i.step-status {
            float: right;
            font-size: 18px;
        }
        .step-title {
            // font-weight: bold;
            display: inline-block;
            font-size: 24px;
            margin-bottom: 30px;
        }

        .tab-pane {
            padding-left: 20px;
            .step-title {
                margin-bottom: 20px;
            }

            li {
                margin-top: 10px;
            }
        }

        .step-proxy {
            .help-container {
                margin-top: 50px;
                margin-bottom: 20px;

                .help {
                    margin-left: 20px;
                    color: rgba(0, 0, 200, 0.8);
                    cursor: pointer;

                    &:hover {
                        color: rgba(0, 0, 200, 0.4);
                    }
                }

                .help-steps-container {
                    padding: 20px;
                    padding-left: 100px;
                }

                .help-image {
                    border: 1px solid black;
                    margin-bottom: 30px;
                    width: 400px;
                }
            }

            .control-containers {
                margin-top: 30px;
                text-align: center;

                .proxy-btn {
                    margin-top: 20px;
                }
            }
        }

        .step-cert {
            .cert-btn {
                margin-top: 20px;
            }
        }

        .continue-btn {
            width: 150px;
            margin-top: 5px;
        }

        .nav.nav-tabs {
            width: 200px;

            li {
                a {
                    cursor: pointer;
                }
            }

            li.disabled {
                pointer-events:none;
            }
        }
    }
</style>
