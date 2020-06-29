import { PersistedState, RendererCachedState, RendererCachedPersistedState } from '@utils/store'

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
    pluginInstallationComplete: new RendererCachedPersistedState(false),
    isFirefoxIncluded: new RendererCachedPersistedState(false),
    autoLaunchEnabled: new RendererCachedPersistedState(true),
    dockIconVisible: new RendererCachedPersistedState(false),
    latestAcceptedPrivacyPolicyVersion: new RendererCachedPersistedState(null),
    language: new RendererCachedPersistedState('en'),
    country: new RendererCachedPersistedState('United States'),
    languageAndCountrySet: new RendererCachedPersistedState(false)
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
    updateInternalBrowserStatus (state) {
      state.isFirefoxIncluded = true
    },
    completeBrowserIntegration(state) {
      state.browserIntegrationComplete = true
    },
    completePluginInstallation(state) {
      state.pluginInstallationComplete = true
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
    },
    changeLanguage(state, language) {
      state.language = language
    },
    changeCountry(state, country) {
      state.country = country
    },
    setLanguageAndCountry(state) {
      state.languageAndCountrySet = true
    }
  }
}
