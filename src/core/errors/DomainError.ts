export class DomainError extends Error {
  constructor(message: string, public code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} was not found`, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized operation') {
    super(message, 'UNAUTHORIZED_ERROR');
    this.name = 'UnauthorizedError';
  }
}
