import { DataServiceRequest } from "./DataServiceRequest";

export class DataService {
  private inFlightRequests = new Set<AbortController>();

  constructor(
    public baseUrl: string = "",
    public globalHeaders: Record<string, string> = {}
  ) {}

  initialize(baseUrl: string, globalHeaders: Record<string, string>) {
    this.baseUrl = baseUrl;
    this.globalHeaders = globalHeaders;
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

  abortInFlightRequests() {
    for (let controller of this.inFlightRequests.values()) {
      controller.abort();
    }
  }

  private createRequest<T>(
    route: string,
    method: string,
    headers?: Record<string, string>,
    body?: BodyInit
  ) {
    let controller = new AbortController();
    this.inFlightRequests.add(controller);
    const request = new DataServiceRequest<T>(
      this.baseUrl + route,
      method,
      Object.assign({}, this.globalHeaders, headers),
      controller,
      body
    );
    request.onComplete(() => this.inFlightRequests.delete(controller));
    return request;
  }
}
