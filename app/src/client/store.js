import { PersistedState, RendererCachedPersistedState } from '@utils/store'

export default {
  state: {
    status: {
      type: 'none',
      message: '',
      progress: 0
    },
    bootComplete: false,
    client: new PersistedState({}),
    registrationComplete: new RendererCachedPersistedState(false),
    browserIntegrationComplete: new RendererCachedPersistedState(false)
  },
  mutations: {
    changeStatus: function(state, status) {
      state.status = status
    },
    clearStatus: function(state) {
      state.status = { type: 'none' }
    },
    completeRegistration: function(state, client) {
      state.client = client
      state.registrationComplete = true
    },
    completeBoot: function(state) {
      state.bootComplete = true
    },
    completeBrowserIntegration: function(state) {
      state.browserIntegrationComplete = true
    }
  }
}