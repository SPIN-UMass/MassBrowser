import { PersistedState, RendererCachedState, RendererCachedPersistedState, fromConfig } from '@utils/store'

export default {
  state: {
    status: {
      type: 'none',
      message: '',
      progress: 0
    },
    sessions: [{id: null, ip: null, state: null}],
    sessionMap: {},
    bootComplete: new RendererCachedState(false),
    client: new PersistedState({}),
    registrationComplete: new RendererCachedPersistedState(false),
    browserIntegrationComplete: new RendererCachedPersistedState(false),
    autoLaunchEnabled: new RendererCachedPersistedState(false),
    dockIconVisible: new RendererCachedPersistedState(false),
    latestAcceptedPrivacyPolicyVersion: new RendererCachedPersistedState(null),
    
    openAccess: new RendererCachedPersistedState(true),
    isRelayReachable: false,
    isServerConnected: false,
    publicAddress: {},
    privateAddress: {},
    publicPort: 0,
    natEnabled: new RendererCachedPersistedState(fromConfig()),
    downloadLimit: new RendererCachedPersistedState(0),
    uploadLimit: new RendererCachedPersistedState(0),
    relayPort: new RendererCachedPersistedState(fromConfig('port')),
  },
  mutations: {
    changeStatus(state, status) {
      state.status = status
    },
    clearStatus(state) {
      state.status = { type: 'none' }
    },
    registerClient(state, client) {
      state.client = client
      state.registrationComplete = true
    },
    completeBoot(state) {
      state.bootComplete = true
    },
    completeBrowserIntegration(state) {
      state.browserIntegrationComplete = true
    },
    changeOpenAccess(state, openAccess) {
        state.openAccess = openAccess
    },
    changeRelayReachable(state, reachable) {
        state.isRelayReachable = reachable
    },
    changeServerConnected(state, connected) {
        state.isServerConnected = connected
    },
    changePublicAddress(state, address) {
        state.publicAddress = address
    },
    changePrivateAddress(state, address) {
        state.privateAddress = address
    },
    changeRelayPort(state, relayPort) {
        state.relayPort = relayPort
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
    updateSession(state, session) {
      if (session.id in state.sessionMap) {
        Object.assign(state.sessionMap[session.id], session)
      } else {
        state.sessionMap[session.id] = session
        state.sessions.push(session)
      }
    },
    removeSession(state, session) {
      let index = state.sessions.findIndex(s => s.id === session.id)
      state.sessions.splice(index, 1)
      delete state.sessionMap[session.id]
    },
    setAutoLauncher(state, enabled) {
      state.autoLaunchEnabled = enabled
    },
    changeDockIconVisible(state, visible) {
      state.dockIconVisible = visible
    },
    setLatestAcceptedPrivacyPolicyVersion(state, version) {
      state.latestAcceptedPrivacyPolicyVersion = version
    }
  }
}