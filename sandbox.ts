type onNext = <T>(result: Result<T>) => void;
type onError = (err: any) => void;
type onComplete = () => void;

function observeRequest<T>(url: string, opts?: RequestInit) {
  const controller = new AbortController();
  const subscribers = new Set<[onNext, onError?, onComplete?]>();

  let error: any;
  let result: Result<T>;

  fetch(url, Object.assign({}, opts, { signal: controller.signal }))
    .then(resp => mapResponseToResult<T>(resp))
    .then(res => {
      subscribers.forEach(([onNext]) => onNext(res));
      result = res;
    })
    .catch(err => {
      if (err.name !== "AbortError") {
        subscribers.forEach(
          ([_, onError]) => onError !== undefined && onError(err)
        );
        error = err;
      }
    })
    .finally(() =>
      subscribers.forEach(
        ([_, __, onComplete]) => onComplete !== undefined && onComplete()
      )
    );

  return (onNext: onNext, onError?: onError, onComplete?: onComplete) => {
    if (result === undefined && error === undefined) {
      subscribers.add([onNext, onError, onComplete]);
    } else {
      if (result !== undefined) {
        onNext(result);
      }

      if (error !== undefined && onError !== undefined) {
        onError(error);
      }

      onComplete !== undefined && onComplete();
    }

    return () => controller.abort();
  };
}

export class Result<T> {
  constructor(public status: number, public headers: Headers, public data: T) {}
}

function mapResponseToResult<T>(resp: Response) {
  const contentType = resp.headers.get("content-type");
  let promise: Promise<any>;

  if (contentType === null) {
    promise = Promise.resolve(null);
  } else if (/json/.test(contentType)) {
    promise = resp.json();
  } else if (/text/.test(contentType)) {
    promise = resp.text();
  } else {
    promise = resp.blob();
  }

  return new Promise<Result<T>>((resolve, reject) => {
    promise
      .then(data => resolve(new Result<T>(resp.status, resp.headers, data)))
      .catch(reject);
  });
}

interface Options {
  baseUrl: string;
  globalHeaders: Record<string, string>;
  timeout: number;
}

const defaultOptions: Options = {
  baseUrl: "",
  globalHeaders: {},
  timeout: 5e3,
};

function createDataService(opts: Options = defaultOptions) {
  const pendingRequests = new Set<() => void>();

  function createRequest<T>(
    route: string,
    method: string,
    headers: Record<string, string> = {},
    body?: Record<string, any> | BodyInit
  ) {
    if (body && typeof body === "object") {
      if (!(body instanceof FormData) || !(body instanceof Blob)) {
        body = JSON.stringify(body);
        headers["content-type"] = "application/json";
      }
    }

    const subscribe = observeRequest<T>(opts.baseUrl + route, {
      method,
      headers: Object.assign({}, opts.globalHeaders, headers),
      body,
    });
    const cancel = subscribe(console.debug, undefined, () =>
      pendingRequests.delete(cancel)
    );

    pendingRequests.add(cancel);
    setTimeout(cancel, opts.timeout);
    return subscribe;
  }

  return {
    initialize(options: Options) {
      opts = options;
    },

    get<T>(route: string, headers?: Record<string, string>) {
      return createRequest<T>(route, "GET", headers);
    },

    post<T>(route: string, body: BodyInit, headers?: Record<string, string>) {
      return createRequest<T>(route, "POST", headers, body);
    },

    put<T>(route: string, body: BodyInit, headers?: Record<string, string>) {
      return createRequest<T>(route, "PUT", headers, body);
    },

    delete<T>(route: string, headers?: Record<string, string>) {
      return createRequest<T>(route, "DELETE", headers);
    },

    abortPendingRequests() {
      for (let func of pendingRequests.values()) {
        func();
      }
    },
  };
}

const dataService = createDataService();

const result = dataService.get<any>("/")(() => {});
