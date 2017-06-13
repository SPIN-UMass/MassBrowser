import Raven from '~/utils/raven'

export class BaseError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }

  toString() {
    if (this.message) {
      return this.message
    }
    return super.toString()
  }

  report() {
    console.error("Report not implemented for this error")
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
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}

export class AuthenticationError extends APIError {
  constructor(message) {
    super(401, message)
  }
}

export class RequestError extends APIError {
  constructor(statusCode, reason, responseBody) {
    super(statusCode || 400, reason)
    this.responseBody = responseBody
  }

  report() {
    Raven.captureException(this)
  }
}

export class ServerError extends APIError {
  constructor(statusCode, message) {
    super(statusCode || 500, message)
  }
}

