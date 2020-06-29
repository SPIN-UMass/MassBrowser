import { PersistedState, RendererCachedState, RendererCachedPersistedState,
        fromConfig } from '@utils/store'

export default {
  state: {
    status: {
      type: 'none',
      message: '',
      progress: 0
    },
    sessions: [],
    syncProgress: 0,
    autoLaunchEnabled: new RendererCachedPersistedState(true),
    dockIconVisible: new RendererCachedPersistedState(false),
    bootComplete: new RendererCachedState(false),
    relay: new PersistedState({}),
    registrationComplete: new RendererCachedPersistedState(false),
    natEnabled: new RendererCachedPersistedState(fromConfig()),
    downloadLimit: new RendererCachedPersistedState(0),
    uploadLimit: new RendererCachedPersistedState(0),

    TCPRelayPort: new RendererCachedPersistedState(fromConfig('port')),
    UDPRelayPort: new RendererCachedPersistedState(fromConfig('UDPPort')),
    openAccess: new RendererCachedPersistedState(true),
    latestAcceptedPrivacyPolicyVersion: new RendererCachedPersistedState(null),

    isTCPRelayReachable: false,
    isUDPRelayReachable: false,

    isServerConnected: false,
    publicAddress: {},
    privateAddress: {},
    publicPort: 0
  },
  mutations: {
    setSyncProgress (state, progress) {
      state.syncProgress = progress
    },
    changeStatus (state, status) {
      state.status = status
    },
    clearStatus (state) {
      state.status = { type: 'none' }
    },
    registerRelay (state, relay) {
      state.relay = relay
      state.registrationComplete = true
    },
    completeBoot (state) {
      state.bootComplete = true
    },
    changeDownloadLimit (state, limit) {
      state.downloadLimit = limit
    },
    changeUploadLimit (state, limit) {
      state.uploadLimit = limit
    },
    changeNatStatus (state, natEnabled) {
      state.natEnabled = natEnabled
    },
    changeTCPRelayPort (state, port) {
      state.TCPRelayPort = port
    },
    changeUDPRelayPort (state, port) {
      state.UDPRelayPort = port
    },
    changeOpenAccess (state, openAccess) {
      state.openAccess = openAccess
    },
    changeTCPRelayReachable (state, reachable) {
      state.isTCPRelayReachable = reachable
    },
    changeUDPRelayReachable (state, reachable) {
      state.isUDPRelayReachable = reachable
    },
    changeServerConnected (state, connected) {
      state.isServerConnected = connected
    },
    setAutoLauncher (state, enabled) {
      state.autoLaunchEnabled = enabled
    },
    changePublicAddress (state, address) {
      state.publicAddress = address
    },
    changePrivateAddress (state, address) {
      state.privateAddress = address
    },
    changeDockIconVisible (state, visible) {
      state.dockIconVisible = visible
    },
    setLatestAcceptedPrivacyPolicyVersion (state, version) {
      state.latestAcceptedPrivacyPolicyVersion = version
    }
  }
}
