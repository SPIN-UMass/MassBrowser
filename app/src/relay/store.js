import { PersistedState, RendererCachedPersistedState } from '@utils/store'

export default {
  state: {
    status: {
      type: 'none',
      message: '',
      progress: 0
    },
    syncProgress: 0,
    isFirstRun: new RendererCachedPersistedState(true),
    bootComplete: false,
    relay: new PersistedState({}), // Has to be cached because it's used in the Root view
    registrationComplete: new RendererCachedPersistedState(false),
    natEnabled: new RendererCachedPersistedState(true),
    downloadLimit: new RendererCachedPersistedState(0),
    uploadLimit: new RendererCachedPersistedState(0),
    relayPort: new PersistedState(8040),
    openAccess: new RendererCachedPersistedState(true),
    isRelayReachable: false,
    isServerConnected: false
  },
  mutations: {
    setSyncProgress(state, progress) {
      state.syncProgress = progress
    },
    changeStatus(state, status) {
      state.status = status
    },
    clearStatus(state) {
      state.status = { type: 'none' }
    },
    registerRelay(state, relay) {
      state.relay = relay
      state.registrationComplete = true
    },
    completeBoot(state) {
      state.bootComplete = true
    },
    changeDownloadLimit(state, limit) {
      state.downloadLimit = limit
    },
    changeUploadLimit(state, limit) {
      state.uploadLimit = limit
    },
    changeNatStatus(state, natEnabled) {
      state.natEnabled = natEnabled
    },
    changeOpenAccess(state, openAccess) {
      state.openAccess = openAccess
    },
    changeRelayReachable(state, reachable) {
      state.isRelayReachable = reachable
    },
    changeServerConnected(state, connected) {
      state.isServerConnected = connected
    }
  }
}