import type { Response, Request } from "express";

export interface HTTPErrorResponse {
  error: string;
}

export type ApiRequest<
  Params = {},
  ResBody = {},
  ReqBody = {},
  ReqQuery = {},
> = Request<Params, ResBody | HTTPErrorResponse, ReqBody, ReqQuery>;
export type ApiResponse<ResBody = {}> = Response<ResBody | HTTPErrorResponse>;

export interface Paginated<T> {
  items: T[];
  nextToken?: string;
}
