<template>
    <div id="m-home">
        <div class="alert alert-info alert-websites" v-if="showWebsitesAlert">
            <span v-on:click="showWebsitesAlert=false">
                <icon class="close" name="times"></icon>
            </span>
            <p>
                Configure the <strong>Websites</strong> you want to use with <strong>MassBrowser</strong> in the<strong>
                <router-link to="/client/settings/websites">Settings</router-link></strong> page
            </p>
        </div>
        <div id="m-client-status-box">
            <div class="alert alert-primary status-box running">
                <h4>
                    You can close this window now!
                </h4>
                <p class="de-emph">
                    <strong>MassBrowser</strong> will continue running in the background.
                </p>
                <p class="de-emph">
                    You can also change your
                    <router-link class="action-link" to="/client/settings">Settings</router-link> or give us
                    <router-link class="action-link" to="/client/feedback">Feedback</router-link>
                </p>
            </div>
        </div>
        <div id="m-client-help-box">
            <p>
                Select the websites you want to browse in the
                <router-link to="/client/websites">Websites</router-link> page
            </p>
            <p>
                See <a v-on:click="openInstructions">Instructions</a>, or open
                <a v-on:click="openFirefox">
                    <icon name="firefox"></icon> Firefox
                </a> to start browsing with MassBrowser
            </p>
        </div>
    </div>
</template>

<script>
  import opn from 'opn'
  import RelayView from './RelayView'
  import MapView from './widgets/MapView'
  import GraphView from './widgets/GraphView'
  import { store } from '@utils/store'
  import { openInternalBrowser } from '../firefox'

  export default {
    store,
    components: {
      RelayView,
      MapView,
      GraphView
    },
    data () {
      return {
        showWebsitesAlert: localStorage.getItem('homeHasBeenRunBefore') !== 'true'
      }
    },
    created () {
      localStorage.setItem('homeHasBeenRunBefore', 'true')
    },
    methods: {
      async openFirefox () {
        let isFirefoxIncluded = this.$store.state.isFirefoxIncluded
        if (isFirefoxIncluded) {
          await openInternalBrowser('http://google.com')
        } else {
          await opn('http://google.com', {app: 'firefox'})
        }
      },
      async openInstructions () {
        await opn('http://massbrowser.cs.umass.edu')
      }
    }
  }
</script>

<style scoped lang='scss'>
    @import './styles/settings.scss';

    #m-home{
        height: $content_height;
        position: relative;
        background-color: white;
        border: 1px solid #eee;

        .alert-websites {
            position: absolute;
            z-index: 1000;
            border: none;
            width: 80%;
            margin: 0 10%;
            padding-left: 30px;
            padding-right: 10px;
            padding-top: 10px;

            .close {
                position: absolute;
                top: 10px;
                left: 10px;
                &:hover {
                    color: orange;
                }
            }

            a {
                color: white;
                &:hover {
                    color: orange;
                }
            }
        }

        #m-client-status-box {
            background: #fcfcfc;
            .action-link {
                cursor: pointer;
                color: white;
                font-weight: bold;
                &:hover {
                    color: orange;
                }
            }

            .de-emph {
                color: rgb(220, 220, 220);
            }

            .status-box {
                margin: 0px;

                border-left: none;
                .title {
                    font-size: 16px;
                }

                &.running {
                    .btn-container {
                        margin-top: -5px;
                    }
                }

                &.not-running {
                    .btn-container {
                        margin-top: 10px;
                    }
                }
            }
        }

        #m-client-help-box {
            padding: 20px 25px;
            font-size: 16px;
            font-weight: 500;
            a {
                font-family: $font-menu;
                font-weight: bold;
                cursor: pointer;
                &:hover {
                    color: orange;
                }
            }
        }

        #map {
            height: 100%;
            // position: absolute;
            // bottom: 2px;
        }

        #graph {
            height: 59%;
            // position: absolute;
            // top: 0px;
        }
    }

</style>
