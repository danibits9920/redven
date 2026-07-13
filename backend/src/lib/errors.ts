// Error de negocio con codigo HTTP. El manejador global lo traduce a JSON.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const BadRequest = (msg: string) => new ApiError(400, msg);
export const Unauthorized = (msg = "No autenticado") => new ApiError(401, msg);
export const Forbidden = (msg = "No autorizado") => new ApiError(403, msg);
export const NotFound = (msg = "No encontrado") => new ApiError(404, msg);
