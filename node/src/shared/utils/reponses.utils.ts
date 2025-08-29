import { Response } from 'express';
import { Data, Pagination } from '../types/response.t';

export const successResponse = function (res: Response, msg: string) {
  const data = {
    status: true,
    message: msg,
  };
  return res.send(data);
};

export const acceptedResponse = function (res: Response, msg: string) {
  const data = {
    status: true,
    message: msg,
  };
  return res.status(202).send(data);
};

export const successResponseWithData = function (
  res: Response,
  msg: string,
  data: Data,
) {
  const resData = {
    status: true,
    message: msg,
    data: data,
  };
  return res.send(resData);
};

export const successPaginationResponseWithData = function (
  paginationData: Pagination,
  res: Response,
  msg: string,
  data: Data,
) {
  const resData = {
    status: true,
    message: msg,
    pagination: paginationData,
    data: data,
  };
  return res.send(resData);
};

export const ErrorResponse = function (
  res: Response,
  err: { code?: string; msg: string },
) {
  const code = err.code ? err.code : '400';
  const data = {
    status: false,
    code: code,
    message: err.msg,
  };
  return res.send(data);
};

export const notFoundResponse = function (res: Response, msg: string) {
  const data = {
    status: false,
    message: msg,
  };
  return res.send(data);
};

export const validationErrorWithData = function (
  res: Response,
  msg: string,
  data: Data,
) {
  const resData = {
    status: false,
    message: msg,
    data: data,
  };
  return res.send(resData);
};

export const unauthorizedResponse = function (res: Response, msg: string) {
  const data = {
    status: false,
    message: msg,
  };
  return res.send(data);
};

export const successPaginationResponseWithDataExtrs = function (
  paginationData: Pagination,
  res: Response,
  msg: string,
  data: Data,
  extra: Data,
) {
  const resData = {
    status: true,
    message: msg,
    pagination: paginationData,
    data: data,
    list: extra,
  };
  return res.send(resData);
};

export const successResponseProject = function (
  res: Response,
  msg: string,
  data: Data,
) {
  const resData = {
    status: true,
    message: msg,
    data: data,
  };
  return res.send(resData);
};
