<template>
    <div id="m-home">
        <div class="m-title">
            <strong>MassClient</strong> is currently running.
        </div>
        <div id="m-client-help-box">
            <p>
                You can close this window and it will continue running in the background.
                If you like MassBrowser please take a moment and give us a <router-link class="action-link" to="/client/feedback">feedback</router-link>. Also you can select the websites that you want to browse in the
                <router-link to="/client/websites">websites</router-link> tab.
            </p>
        </div>
        <div class="m-client-open-browser" v-on:click="openFirefox">
            <div v-if="this.$store.state.isFirefoxIncluded">
                Open MassBrowser
            </div>
            <div v-else >
                Open <icon name="firefox"></icon> Firefox
            </div>
        </div>

    </div>
</template>

<script>
  import opn from 'opn'
  import { store } from '@utils/store'
  import { openInternalBrowser } from '../firefox'

  export default {
    store,
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
      }
    }
  }
</script>

<style scoped lang='scss'>
    @import './styles/settings.scss';

    .m-title {
        font-size: 16px;
        margin-bottom: 20px;
    }

    .m-client-open-browser {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 50%;
        background-color: #94132a;
        color: white;
        height: 50px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 5px;
        user-select: none;
        &:hover {
            background-color: #b21733;
        }

        &:active {
            margin-top: 1px;
        }
    }

    #m-home{
        display: flex;
        flex-direction: column;
        align-items: center;
        height: $content_height;
        padding: 20px;
        background-color: white;

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
                margin: 0;

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
            text-align: center;
            margin-bottom: 50px;
            font-size: 15px;
            font-weight: 500;
            a {
                font-weight: bold;
                cursor: pointer;
                &:hover {
                    color: orange;
                }
            }
        }
    }

</style>
