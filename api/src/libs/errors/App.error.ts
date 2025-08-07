export type RepositoryErrorCodes =
  | {
      code: 'repository.not_found'
      status: 404
    }
  | {
      code: 'repository.query_failed'
      status: 500
    }
  | {
      code: 'repository.creation_failed'
      status: 500
    }
  | {
      code: 'repository.update_failed'
      status: 500
    }
  | {
      code: 'repository.deletion_failed'
      status: 500
    }
  | {
      code: 'repository.multiple_found'
      status: 500
    }

export type SecurityErrorCodes =
  | {
      code: 'security.access_denied'
      status: 403
    }
  | {
      code: 'security.invalid_token'
      status: 401
    }
  | {
      code: 'security.invalid_credentials'
      status: 401
    }
  | {
      code: 'security.invalid_request'
      status: 400
    }
  | {
      code: 'security.missing_token'
      status: 401
    }
  | {
      code: 'security.invalid_role'
      status: 400
    }
  | {
      code: 'security.invalid_origin'
      status: 400
    }
  | {
      code: 'security.azure.auth_url_failed'
      status: 500
    }
  | {
      code: 'security.azure.token_exchange_failed'
      status: 401
    }
  | {
      code: 'security.azure.user_info_failed'
      status: 500
    }

export type ApiErrorCodes =
  | {
      code: 'api.service_unavailable'
      status: 503
    }
  | {
      code: 'api.validation.outgoing_failed'
      status: 500
    }
  | {
      code: 'api.validation.incoming_failed'
      status: 400
    }

type LLMErrorCodes = {
  code: 'llm.execution_failed'
  status: 500
}

export type FileErrorCodes =
  | {
      code: 'file.not_found'
      status: 404
    }
  | {
      code: 'file.permission_denied'
      status: 403
    }
  | {
      code: 'file.bad_request'
      status: 400
    }
  | {
      code: 'file.read_failed'
      status: 500
    }

export type AppErrorCodes =
  | RepositoryErrorCodes
  | SecurityErrorCodes
  | ApiErrorCodes
  | FileErrorCodes
  | {
      code: 'error.unknown'
      status: 500
    }
  | {
      code: 'error.assertion'
      status: 500
    }
