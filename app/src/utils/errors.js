import Raven from '~/utils/raven'

function sanitizeUrl(url) {
  var regex = /((?:website|domain|cdn|nat|category|region|user|client|relay|session)\/).{11}(\/|$)/g
  return url.replace(regex, '$1[id]$2')
}

export function BaseError(message) {
  const error = new Error(message)
  const subclassNames = []

  error.smart = true

  error.log = function() {
    console.error(error)
  }

  error.report = function() {
    // Raven.captureException(error)
  }

  error.logAndReport = function() {
    error.log()
    error.report()
  }

  error.is = function(cls) {
    return subclassNames.indexOf(cls.name) !== -1
  }

  error._addSubclass = function(name) {
    error.name = name
    subclassNames.push(name)
    error.message = `${name}  ${message}`
  }
  
  return error
}

export function AppError(message) {
  const error = BaseError(message)
  error._addSubclass('AppError')
  return error
}

export function NetworkError(message) {
  const error = BaseError(message)
  error._addSubclass('NetworkError')
  return error
}

export function APIError(statusCode, statusText, response, request) {
  var url = request ? `(${sanitizeUrl(request.url)})` : ''

  const error = BaseError(`${statusCode} ${statusText} ${url}`)
  error._addSubclass('APIError')

  error.statusCode = statusCode
  error.statusText = statusText
  error.response = response
  error.url = request.url

  error.report = function() {
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

export function AuthenticationError(message) {
  const error = APIError(401, message)
  error._addSubclass('AuthenticationError')
  return error
}

export function RequestError(statusCode, statusText, response, request) {
  const error = APIError(statusCode || 400, statusText, response, request)
  error._addSubclass('RequestError')
  return error
}

export function ServerError(statusCode, statusText, response, request) {
  const error = APIError(statusCode || 500, statusText, response, request)
  error._addSubclass('ServerError')
  return error
}
