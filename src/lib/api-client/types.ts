export interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 409: el recurso fue tomado por otro usuario (concurrencia en agenda). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** Cuerpo serializado como JSON automáticamente. */
  body?: unknown;
  /** Query string construida a partir de este objeto. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Aborta la petición pasados N ms. Por defecto 15000. */
  timeoutMs?: number;
}
