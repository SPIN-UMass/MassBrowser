<template>
  <div id="page-firefox">
    <div class="tab-base tab-stacked-left">
      <ul class="nav nav-tabs">
        <li :class="{active: tab==='plugin'}"> 
          <a v-on:click="tab='plugin'" >
            MassBrowser Plugin
            <i class="step-status text-danger fa fa-times-circle" v-if="!plugin.success"></i>
            <i class="step-status text-success fa fa-check-circle" v-if="plugin.success"></i>
          </a> 
        </li>
        <li :class="{active: tab==='cert', disabled: !plugin.success}" > 
          <a v-on:click="tab='cert'" > Trust CA Certificate
            <i class="step-status text-danger fa fa-times-circle" v-if="!cert.success"></i>
            <i class="step-status text-success fa fa-check-circle" v-if="cert.success"></i>
          </a> 
        </li>
        <li :class="{active: tab==='dnsCache', disabled: !cert.success}">
          <a v-on:click="tab='dnsCache'">
            Disable DNS Cache
            <i class="step-status text-danger fa fa-times-circle" v-if="!dnsCache.success"></i>
            <i class="step-status text-success fa fa-check-circle" v-if="dnsCache.success"></i>
          </a>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane step-plugin" :class="{active: tab==='plugin', in: tab==='plugin'}">
          <div class="step-title text-thin">Add MassBrowser Plugin</div>
          <div v-if="!plugin.success">
            <ol>
              <li>Click on the button bellow to add MassBrowser plugin into your Firefox.</li>
              <li>Click on 'Continue to Installation'</li>
              <li>Click on 'Add'</li>
              <li>To verify your installation click the verify button bellow.</li>
            </ol>
            <div class="control-containers">
              <div class="text-primary text-bold" v-if="plugin.success===null"> Checking plugin working ... </div>
              <div class="text-success text-bold" v-if="plugin.success===true"> Plugin is working </div>
              <div class="text-danger text-bold" v-if="plugin.success===false &amp;&amp; plugin.errorMessage"> {{plugin.errorMessage}} </div>
              <button class="plugin-btn btn btn-primary" v-if="plugin.success !== null" v-on:click="checkPlugin"> Verify Installations </button>
              <button class="cert-btn btn btn-success" v-on:click="addPlugin"> Add plugin </button>
            </div>
            <div class="help-container">
              <span class="help" v-if="!plugin.helpEnabled" v-on:click="plugin.helpEnabled = true">
                Need Help? Click here to show step by step instructions.
              </span>
              <div class="help-steps-container" v-if="plugin.helpEnabled">
                <div class="help-image" v-for="image in plugin.stepImages">
                  <img :src="image" />
                </div>
              </div>
            </div>
          </div>
          <div class="text-center pad-all" v-if="plugin.success">
            <i class="fa fa-check-circle fa-4x text-success mar-all"></i>
            <div>
              <button class="continue-btn btn btn-success btn-rounded mar-all" v-on:click="nextStep">
                Continue
              </button>
            </div>
          </div>
        </div>
        <div class="tab-pane step-cert" :class="{active: tab==='cert', in: tab==='cert'}">
          <div class="step-title text-thin">Trust CA Certificate</div>
          <div v-if="!cert.success">
            <p><strong>MassBrowser</strong> requires your browser to trust a root CA Certificate. The certificate is generated locally and does not expose you to any security risks as long as it is kept within your machine.</p>
            <div class="alert alert-info">
              <p>This is a <strong>local certificate that does not pose any threat</strong> to your confidentiality when you browse websites. The certifcate is generated and stored only on this machine, you <strong>must not</strong> share it with anyone. Click <strong>here</strong> to view the location of the stored certificate.</p>
              <p>You can remove the certificate at any time by going to your browser’s setting and searching for <code>MassBrowser</code></p>
            </div>
            <p>Follow the instructions below to install the certificate</p>
            <ol>
              <li>Click on the button below to save your local certificate in your desired location</li>
              <li>Open Firefox <strong>Preferences</strong> and click on <strong> View Certificate </strong> button under <strong> Privacy & Security</strong></li>
              <li>Click on <strong>Import</strong> button under <strong>Authorities</strong> tab </li>
              <li>Select <code>ca.pem</code> file which you saved in step 1</li>
              <li style="font-weight: bold">Select the <code>Trust this CA to identify websites</code> option and click OK</li>
            </ol>
            <div class="help-steps-container text-center">
              <div class="help-image"><img width="300" :src="cert.image" /></div>
            </div>
            <div class="text-center mar-all">
              <button class="cert-btn btn btn-success" v-on:click="installCert">Get your local certificate</button>
            </div>
          </div>
          <div class="text-center pad-all" v-if="cert.success"><i class="fa fa-check-circle fa-4x text-success mar-all"></i>
            <div>
              <button class="continue-btn btn btn-success btn-rounded mar-all" v-on:click="nextStep">Continue</button>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" :class="{active: tab==='dnsCache', in: tab==='dnsCache'}">
          <div class="step-title text-thin">Disable DNS Cache</div>
          <div v-if="!dnsCache.success">
            <p>The browser's DNS cache must be disabled for MassBrowser to work</p>
            <ol>
              <li>In your URL bar enter <code>about:config</code></li>
              <li>If a warning message appears click on <code>I accept the risk!</code> button</li>
              <li>Search for the key <code>network.dnsCacheExpiration</code> and change the value to <code>0</code></li>
              <li>Click on the button below test whether the change was successful</li>
            </ol>
            <div class="text-center mar-all">
              <button class="cert-btn btn btn-primary" v-on:click="checkDNSCache">Check DNS Cache</button>
            </div>
          </div>
          <div class="text-center pad-all" v-if="dnsCache.success"><i class="fa fa-check-circle fa-4x text-success mar-all"></i>
            <div>
              <button class="continue-btn btn btn-success btn-rounded mar-all" v-on:click="nextStep">Continue</button>
            </div>
          </div>
        </div>
        <div class="tab-pane" :class="{active: tab==='finish', in: tab==='finish'}">
          <div class="text-center mar-all pad-all"><i class="fa fa-check-circle fa-5x text-success mar-all"></i>
            <h4>You're good to go</h4> 
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios/dist/axios'
  import { ONBOARDING_DOMAIN, ONBOARDING_ADDRESS, NO_HOST_HANDLER_PORT, SOCKS_PORT } from '../config'

  var pluginStepImages = [
    require('../assets/images/plugin-step-1.png'),
    require('../assets/images/plugin-step-2.png'),
    require('../assets/images/plugin-step-3.png')
  ]

  var certImage = require('../assets/images/cert.png')

  var steps = ['plugin','cert', 'dnsCache', 'finish']

  export default {
    data() {
      return {
        name: 'FirefoxComponent',
        plugin: {
          success: null,
          errorMessage: null,
          helpEnabled: false,
          stepImages: pluginStepImages
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
        tab: 'plugin',
        socksPort: SOCKS_PORT
      }
    },
    created () {
      this.checkPlugin()
      .then(() => {
        if (this.plugin.success) {
          this.nextStep()
          this.checkCert()
          .then(() => {
            if (this.cert.success && this.tab === 'cert') {
              this.nextStep()
              this.checkDNSCache()
              .then(() => {
                console.log(this.dnsCache.success, this.tab)
                if (this.dnsCache.success && this.tab === 'dnsCache') {
                  this.nextStep()
                }
              })
            }
          })
        }
      })
    },
    methods: {
      onFinishTab () {

      },
      onTabChange () {
        console.log('tab changed to', this.tab)
        if (this.tab === 'finish') {
          return axios.get(`http://${ONBOARDING_DOMAIN}/settings-complete`)
        } else if (this.tab === 'cert') {
          this.checkCert()
        } else if (this.tab === 'dnsCache') {
          this.checkDNSCache()
          .then(() => {
            console.log(this.dnsCache.success, this.tab)
              if (this.dnsCache.success && this.tab === 'dnsCache') {
                  this.nextStep()
            }
          })
        }
      },
      checkPlugin () {
        return axios.get(`http://${ONBOARDING_DOMAIN}/check-plugin`)
          .then(response => {
            if (response.data === 'active') {
              this.plugin.success = true
              this.pollCertValidation = true
            }
          })
          .catch(e => {
            console.error(e)
            this.plugin.success = false
            this.plugin.errorMessage = 'Plugin settings not valid. Make sure to install the plugin.'
          })
      },
      checkProxySettings (showError=true) {
        return axios.get(`http://${ONBOARDING_DOMAIN}/check-proxy`)
        .then(response => {
          if (response.data === 'active') {
            this.plugin.success = true

            // this.checkCert()
            this.pollCertValidation = true
          } else {
            if (showError) {
              this.plugin.errorMessage = 'Proxy settings not valid.'
            }
          }
        })
        .catch(e => {
          console.error(e)
          this.plugin.success = false
          if (showError) {
            this.plugin.errorMessage = 'Proxy settings not valid. Make sure the application is running.'
          }
        })
      },
      addPlugin () {
        window.open(`http://${ONBOARDING_ADDRESS}/plugin`, '_self')
      },
      installCert () {
        console.log('Requesting certificate dialog')
        window.open(`http://${ONBOARDING_ADDRESS}/cert`,'_self')
        if (!this.cert.checkIntervalStarted) {
          this.pollCertValidation = true
          this.cert.checkIntervalStarted = true;
          setTimeout(this.checkCert, 2000)
        }
      },
      checkCert () {
        console.log('Checking Certificate')
        if (!this.plugin.success) {
          return new Promise((resolve, reject) => {
            this.cert.success = false
            resolve()
          })
        }

        return axios.get(`https://${ONBOARDING_DOMAIN}/`, { validateStatus: () => true })
        .then(response => {
          this.cert.success = true
          this.pollCertValidation = false
        })
        .catch(e => {
          console.error(e)
          this.cert.success = false
        })
        .then(() => {
          if (this.pollCertValidation) {
            setTimeout(this.checkCert, 2000)
          }
        })

      },
      checkDNSCache () {
        console.log('Checking DNS')
        if (!this.plugin.success) {
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
              console.log("RESPONSE")
              // console.log(response)
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
        function runMultipleTests(count, result) {
          return testDNSCache()
          .then(success => success ? (count >= 1 ? runMultipleTests(count-1) : true) : false)
        }

        return runMultipleTests(3)
        .then(success => {
          this.dnsCache.success = success
        })
      },
      nextStep() {
        console.log(this.tab)
        let next = steps.indexOf(this.tab) + 1
        this.tab = steps[next]
        if (this[this.tab] && this[this.tab].success) {
          console.log('herreeeee', this.tab)
          return this.nextStep()
        }

        this.onTabChange()
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
      padding: 0 20px;
      .step-title {
        margin-bottom: 20px;
      }

      li {
        margin-top: 10px;
      }
    }

    .step-plugin {
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .help-image {
          border: 1px solid black;
          margin-bottom: 30px;
        }
      }

      .control-containers {
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          justify-content: center;
        margin-top: 30px;
        text-align: center;

        .plugin-btn {
          margin: 5px;
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
        padding: 10px;
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
