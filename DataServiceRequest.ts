import {
  DataServiceResponse,
  mapResponseToDataServiceResponse,
} from "./DataServiceResponse";

export class DataServiceRequest<T> {
  private cancelHandlers = new Set();
  private cancelled = false;
  private completeHandlers = new Set();
  private error: any;
  private errorHandlers = new Set();
  private response: DataServiceResponse<T>;
  private responseHandlers = new Set();

  constructor(
    private url: string,
    private method: string,
    private headers: Record<string, string>,
    private controller: AbortController,
    private body?: BodyInit
  ) {
    fetch(this.url, {
      body: this.body,
      headers: this.headers,
      method: this.method,
      signal: this.controller.signal,
    })
      .then(resp => mapResponseToDataServiceResponse<T>(resp))
      .then(resp => {
        this.responseHandlers.forEach(callback => callback(resp));
        this.response = resp;
      })
      .catch(error => {
        if (error && error.name === "AbortError") {
          this.cancelHandlers.forEach(callback => callback());
        } else {
          this.errorHandlers.forEach(callback => callback(error));
          this.error = error;
        }
      })
      .then(() => this.completeHandlers.forEach(callback => callback()));
  }

  cancel() {
    this.controller.abort();
    this.cancelled = true;
  }

  onCancel(callback: Function) {
    this.cancelHandlers.add(callback);
    if (this.cancelled) {
      callback();
    }
    return this;
  }

  onComplete(callback: Function) {
    this.completeHandlers.add(callback);
    if (this.error !== undefined || this.response !== undefined) {
      callback();
    }
    return this;
  }

  onError(callback: (err: any) => void) {
    this.errorHandlers.add(callback);
    if (this.error !== undefined) {
      callback(this.error);
    }
    return this;
  }

  onNext(callback: (resp: DataServiceResponse<T>) => void) {
    this.responseHandlers.add(callback);
    if (this.response !== undefined) {
      callback(this.response);
    }
    return this;
  }
}
