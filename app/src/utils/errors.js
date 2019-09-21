import Raven from '~/utils/raven'

function sanitizeUrl (url) {
  var regex = /((?:website|domain|cdn|nat|category|region|user|client|relay|session)\/).{11}(\/|$)/g
  return url.replace(regex, '$1[id]$2')
}

/**
 * Note: All function definitions for errors must go in the constructor not in the prototype
 */

export class BaseError extends Error {
  constructor (message) {
    super(message)
    this.smart = true
    this.name = this.constructor.name

    var err = null
    if (message instanceof Error) {
      this.message = message.message
      err = message
      this.stack = err.stack
    } else {
      this.message = message
      err = new Error(message)

      // This messes up the stack trace file locations in the console output, but
      // doesn't effect sentry logs
      // err.name = this.constructor.name
      this.stack = err.stack
    }

    this.log = function () {
      console.error(this.stack)
    }

    this.report = function () {
      Raven.captureException(this)
    }

    this.logAndReport = function() {
      this.log()
      this.report()
    }

    this.is = function (cls) {
      return this instanceof cls
    }
  }
}
// Inherit from Error, this is important both for Raven and bluebird error filtering
// BaseError.prototype = Object.create(Error.prototype)

export class AppError extends BaseError {}

/* ----------- API Errors --------- */

export class APIError extends BaseError {
  constructor (statusCode, statusText, response, request) {
    var url = request ? `(${sanitizeUrl(request.url)})` : ''
    super(`${statusCode} ${statusText} ${url}`)

    this.statusCode = statusCode
    this.statusText = statusText
    this.response = response
    this.request = request
    this.url = (request || {}).url

    this.report = function () {
      Raven.captureException(this, {
        extra: {
          'http:response:status': this.statusCode,
          'http:response:statusText': this.message,
          'http:response:data': this.response.data,
          'http:response:headers': this.response.headers,
          'http:request:url': this.url,
          'http:request:data': this.request.data
        }
      })
    }
  }
}

export class AuthenticationError extends APIError {
  constructor (message) {
    super(401, message)
  }
}

export class RequestError extends APIError {
  constructor (statusCode, statusText, response, request) {
    super(statusCode || 400, statusText, response, request)
  }
}

export class ServerError extends APIError {
  constructor (statusCode, statusText, response, request) {
    super(statusCode || 500, statusText, response, request)
  }
}

export class PermissionDeniedError extends RequestError {
  constructor (statusCode, statusText, response, request) {
    super(statusCode || 401, statusText, response, request)
  }
}

/* ---------- Network Errors -------- */

export class NetworkError extends BaseError {}

export class RelayConnectionError extends NetworkError {}

export class UDPRelayConnectionError extends NetworkError {}

/* ----------- Other Errors ----------- */

export class ApplicationBootError extends AppError {
  /**
   * @param retriable if error is retriable then user can try to boot application again
   */
  constructor (message, retriable, originalError) {
    super(message)
    this.retriable = retriable
    this.originalError = originalError
  }
}

export class NotImplementedError extends BaseError {}
export class SessionRejectedError extends AppError {}
export class NoRelayAvailableError extends AppError {}
export class InvalidInvitationCodeError extends AppError {}
export class InvalidHostError extends AppError {}
export class AutoUpdateError extends AppError {}
export class InvalidEnvironmentError extends AppError {}
export class CacheBrowserError extends AppError {}
export class NotCacheBrowsableError extends CacheBrowserError {}
export class NoSuchMutationError extends AppError {}
