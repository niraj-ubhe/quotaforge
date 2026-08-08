import { Request, Response, NextFunction } from "express";
import { ParsedQs } from "qs";

const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
