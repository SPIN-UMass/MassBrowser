class BaseError {
  constructor(message) {
    this.message = message
  }

  toString() {
    if (this.message) {
      return this.message
    }
    return super.toString()
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
  constructor(statusCode, message) {
    super(statusCode || 400, message)
  }
}

export class ServerError extends APIError {
  constructor(statusCode, message) {
    super(statusCode || 500, message)
  }
}

