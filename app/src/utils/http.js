import axios from 'axios'

import * as errors from '~/utils/errors'

class HttpClient {
  constructor () {
    this.authToken = null
  }

  put (url, data, config) {
    config = config || {}
    config.validateStatus = status => true
    this._setHeaders(config)
    return axios.put(url, data, config)
    .catch(r => this.handleNetworkError({url: url, data: data}, r))
    .then(r => this.handleResponse({url: url, data: data}, r))
  }

  post (url, data, config) {
    config = config || {}
    config.validateStatus = status => true
    this._setHeaders(config)
    return axios.post(url, data, config)
    .catch(r => this.handleNetworkError({url: url, data: data}, r))
    .then(r => this.handleResponse({url: url, data: data}, r))
  }

  get (url, config) {
    config = config || {}
    config.validateStatus = status => true
    this._setHeaders(config)
    return axios.get(url, config)
    .catch(r => this.handleNetworkError({url: url}, r))
    .then(r => this.handleResponse({url: url}, r))
  }

  _setHeaders (config) {
    if (this.authToken) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = 'Token ' + this.authToken
    }
  }

  setAuthToken (authToken) {
    this.authToken = authToken
  }

  handleResponse (request, response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else if (response.status >= 500) {
      throw new errors.ServerError(response.status, response.statusText, response, request)
    } else {
      throw new errors.RequestError(response.status, response.statusText, response, request)
    }
  }

  handleNetworkError (request, err) {
    throw new errors.NetworkError(err)
  }
}

const http = new HttpClient()

export default http
