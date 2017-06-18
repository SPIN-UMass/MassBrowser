import Raven from '~/utils/raven'

function sanitizeUrl (url) {
  var regex = /((?:website|domain|cdn|nat|category|region|user|client|relay|session)\/).{11}(\/|$)/g
  return url.replace(regex, '$1[id]$2')
}

export function BaseError (error, message) {
  // const error = new Error(message)
  const errorMessage = error.message

  const subclassNames = []

  error.smart = true

  error.log = function () {
    console.error(error)
  }

  error.report = function () {
    // Raven.captureException(error)
  }

  error.logAndReport = function () {
    error.log()
    error.report()
  }

  error.is = function (cls) {
    return subclassNames.indexOf(cls.name) !== -1
  }

  error._addSubclass = function (name) {
    error.name = name
    subclassNames.push(name)
    if (message) {
      error.message = `${name} - ${message}`
    } else if (errorMessage && !errorMessage.startsWith('\n')) {
      error.message = `${name} - ${errorMessage}`
    } else if (errorMessage) {
      error.message = `${name} ${errorMessage}`
    } else {
      error.message = `${name}`
    }
  }

  error._addSubclass('BaseError')

  return error
}

export function AppError (error, message) {
  error = BaseError(error, message)
  error._addSubclass('AppError')
  return error
}

/* ----------- API Errors --------- */

export function APIError (error, statusCode, statusText, response, request) {
  var url = request ? `(${sanitizeUrl(request.url)})` : ''

  error = BaseError(error, `${statusCode} ${statusText} ${url}`)
  error._addSubclass('APIError')

  error.statusCode = statusCode
  error.statusText = statusText
  error.response = response
  error.url = request.url

  error.report = function () {
    Raven.captureException(this.error, {
      extra: {
        'http:response:status': this.statusCode,
        'http:response:statusText': this.message,
        'http:response:data': this.response.data,
        'http:response:headers': this.response.headers,
        'http:request:url': this.request.url,
        'http:request:data': this.request.data
      }
    })
  }

  return error
}

export function AuthenticationError (error, message) {
  error = APIError(error, 401, message)
  error._addSubclass('AuthenticationError')
  return error
}

export function RequestError (error, statusCode, statusText, response, request) {
  error = APIError(error, statusCode || 400, statusText, response, request)
  error._addSubclass('RequestError')
  return error
}

export function ServerError (error, statusCode, statusText, response, request) {
  error = APIError(error, statusCode || 500, statusText, response, request)
  error._addSubclass('ServerError')
  return error
}

/* ---------- Network Errors -------- */

export function NetworkError (error, message) {
  error = BaseError(error, message)
  error._addSubclass('NetworkError')
  return error
}

export function RelayConnectionError (error, message) {
  error = NetworkError(error, message)
  error._addSubclass('RelayConnectionError')
  return error
}

/* ----------- Other Errors ----------- */

export function SessionRejectedError (error, message) {
  error = AppError(error, message)
  error._addSubclass('SessionRejectedError')
  return error
}

export function NoRelayAvailableError (error, message) {
  error = AppError(error, message)
  error._addSubclass('NoRelayAvailableError')
  return error
}
