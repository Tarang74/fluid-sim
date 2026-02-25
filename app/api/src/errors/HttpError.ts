export default class HttpError extends Error {
  status: number = 400;
  message: string = "HttpError: <Reason>";

  constructor(status: number, message: string) {
    super(message);
    this.message = message;
    this.status = status;
    this.name = "HttpError";

    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
