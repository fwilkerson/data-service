import { DataServiceRequest } from "./DataServiceRequest";

export class DataService {
  private pendingRequests = new Map<number, AbortController>();

  constructor(
    private baseUrl: string = "",
    private globalHeaders: Record<string, string> = {},
    private timeout: number = 5e3
  ) {}

  initialize(
    baseUrl: string,
    globalHeaders: Record<string, string>,
    timeout: number
  ) {
    this.baseUrl = baseUrl;
    this.globalHeaders = globalHeaders;
    this.timeout = timeout;
  }

  get<T>(route: string, headers?: Record<string, string>) {
    return this.createRequest<T>(route, "GET", headers);
  }

  post<T>(route: string, body: BodyInit, headers?: Record<string, string>) {
    return this.createRequest<T>(route, "POST", headers, body);
  }

  put<T>(route: string, body: BodyInit, headers?: Record<string, string>) {
    return this.createRequest<T>(route, "PUT", headers, body);
  }

  delete<T>(route: string, headers?: Record<string, string>) {
    return this.createRequest<T>(route, "DELETE", headers);
  }

  abortPendingRequests() {
    for (let [timeoutId, controller] of this.pendingRequests.entries()) {
      clearTimeout(timeoutId);
      controller.abort();
    }
  }

  private createRequest<T>(
    route: string,
    method: string,
    headers?: Record<string, string>,
    body?: BodyInit
  ) {
    // setup abort & timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(controller.abort, this.timeout);
    this.pendingRequests.set(timeoutId, controller);

    if (body && typeof body === "object") {
      // TODO: stringify
    }

    // initiate the request
    const request = new DataServiceRequest<T>(
      this.baseUrl + route,
      method,
      Object.assign({}, this.globalHeaders, headers),
      controller,
      body
    );

    // cleanup abort and timeout when completed
    request.onComplete(() => {
      clearTimeout(timeoutId);
      this.pendingRequests.delete(timeoutId);
    });

    return request;
  }
}
