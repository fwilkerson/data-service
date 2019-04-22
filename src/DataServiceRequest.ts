import {
  DataServiceResponse,
  mapResponseToDataServiceResponse,
} from "./DataServiceResponse";

export class DataServiceRequest<T> {
  private cancelled = false;
  private completeHandlers = new Set();
  private error: any;
  private errorHandlers = new Set();
  private response?: DataServiceResponse<T>;
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
        this.responseHandlers.forEach(func => func(resp));
        this.response = resp;
      })
      .catch(error => {
        if (error && error.name === "AbortError") {
          this.cancelled = true;
        } else {
          this.errorHandlers.forEach(func => func(error));
          this.error = error;
        }
      })
      .then(() => this.completeHandlers.forEach(func => func(this.cancelled)));
  }

  cancel() {
    this.controller.abort();
  }

  onComplete(func: (cancelled: boolean) => void) {
    this.completeHandlers.add(func);
    if (
      this.error !== undefined ||
      this.response !== undefined ||
      this.cancelled
    ) {
      func(this.cancelled);
    }
    return this;
  }

  onError(func: (err: any) => void) {
    this.errorHandlers.add(func);
    if (this.error !== undefined) {
      func(this.error);
    }
    return this;
  }

  onNext(func: (resp: DataServiceResponse<T>) => void) {
    this.responseHandlers.add(func);
    if (this.response !== undefined) {
      func(this.response);
    }
    return this;
  }
}
