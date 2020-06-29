<template>
    <div id="m-home">
        <div id="m-relay-toggle-box">
            <div class="alert alert-primary status-box running" v-if="openAccess">
                <h4>{{$t('HOME_RELAY_YOU_CAN_CLOSE_WINDOW')}}</h4>
                <p class="de-emph">
                    <i18n path="HOME_RELAY_IS_RUNNING">
                        <strong slot="massBuddy">MassBuddy</strong>
                    </i18n>
                </p>
                <p class="de-emph">
                    <i18n path="HOME_RELAY_MSG">
                        <router-link slot="settings" class="action-link" to="/relay/settings">{{$t('MENU_SETTINGS')}}</router-link><router-link slot="feedback" class="action-link" to="/relay/feedback">{{$t('MENU_FEEDBACK')}}</router-link><span slot="stop" class="action-link" v-on:click="onChange(false)">{{$t('HOME_RELAY_STOP_MASSBUDDY')}}</span>.
                    </i18n>
                </p>
            </div>
            <div class="alert alert-danger status-box not-running" v-if="!openAccess">
                <h4>
                    <i18n path="HOME_RELAY_IS_NOT_RUNNING">
                        <strong slot="massBuddy">MassBuddy</strong>
                    </i18n>
                </h4>
                <p class="de-emph">
                    {{$t('HOME_RELAY_DISCONNECTED')}}
                </p>
                <p class="de-emph">
                    <i18n path="HOME_RELAY_ALLOW_CLIENT">
                        <span slot="start" class="action-link" v-on:click="onChange(true)">{{$t('HOME_RELAY_START_MASSBUDDY')}}</span>.
                    </i18n>
                </p>
            </div>
        </div>
        <RelayStatus class="relay-status"></RelayStatus>
        <div class="access-toggle-btn-container">
            <button class="btn btn-danger" v-if="openAccess" v-on:click="onChange(false)">
                {{$t('HOME_RELAY_STOP_MASSBUDDY')}}
            </button>
            <button class="btn btn-success" v-if="!openAccess" v-on:click="onChange(true)">
                {{$t('HOME_RELAY_START_MASSBUDDY')}}
            </button>
        </div>
    </div>
</template>

<script>
  import MapView from './widgets/MapView'
  import RelayStatus from './widgets/RelayStatus'
  import { getService } from '@utils/remote'
  import { store } from '@utils/store'
  import { mapState } from 'vuex'

  const relayManager = getService('relay')

  export default {
    store,
    computed: mapState({
      openAccess: 'openAccess'
    }),
    components: {
      MapView,
      RelayStatus,
    },
    methods: {
      onChange: function (openAccess) {
        if (openAccess) {
          relayManager.startRelay()
        } else {
          relayManager.stopRelay()
        }
      }
    }
  }
</script>

<style scoped lang='scss'>
    @import '~@/views/styles/settings.scss';

    #m-home{
        height: $content_height;
        position: relative;
        border-bottom: 1px solid #dadada;
        background: white;

        #m-relay-toggle-box {
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

            .status-container {
                padding: 0 10px;

                .col-led {
                    text-align: right;
                }

                .col-text {
                    // padding: 0;
                }

                .row-stat {
                    margin-top: 5px;
                }
            }

            .toggle-container {
                display: inline-block;
                position: absolute;
                right: 10px;
            }

        }

        .map {
            height: 25%;
            box-shadow: 0 -1px 0 0 rgba(0,0,0,.1);
        }


        .relay-status {
            //  height: 50%;
        }

        .access-toggle-btn-container {
            // margin-top: 10px;
            padding: 20px;
            text-align: right;
        }
    }

</style>
