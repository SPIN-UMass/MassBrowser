import Raven from '~/utils/raven'

export class BaseError extends Error {
  constructor(message) {
    super(message)
    // this.message = message
    // this.error = new Error(`${this.constructor.name}: ${message}`)
    // this.error.name = this.constructor.name
    this.name = this.constructor.name
  }

  toString() {
    if (this.message) {
      return this.message
    }
    return super.toString()
  }

  report() {
    Raven.captureException(this.error)
  }

  log() {
    console.error(this.error)
  }

  logAndReport() {
    this.log()
    this.report()
  }
}

export class AppError extends BaseError{
  constructor(message) {
    super(message)
  }
}

export class NetworkError extends BaseError {
  constructor(message) {
    super(message)
  }
}

export class APIError extends BaseError {
  constructor(statusCode, statusText, response, request) {
    var url = request ? `(${request.url})` : ''
    super(`${statusCode} ${statusText} ${url}`)
    this.statusCode = statusCode
    this.statusText = statusText
    this.response = response
    this.url = request.url
  }

  log() {
    console.error(this.error)
  }
  
  report() {
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
}

export class AuthenticationError extends APIError {
  constructor(message) {
    super(401, message)
  }
}

export class RequestError extends APIError {
  constructor(statusCode, statusText, response, request) {
    super(statusCode || 400, statusText, response, request)
  }

}

export class ServerError extends APIError {
  constructor(statusCode, message, response, request) {
    super(statusCode || 500, message, response, request)
  }
}

