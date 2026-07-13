import { Request, Response, NextFunction, RequestHandler } from "express";

// Envuelve un handler async para que los errores lleguen al manejador global.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
