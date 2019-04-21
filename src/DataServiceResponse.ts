export class DataServiceResponse<T> {
  constructor(public status: number, public headers: Headers, public data: T) {}
}

export function mapResponseToDataServiceResponse<T>(resp: Response) {
  return new Promise<DataServiceResponse<T>>((resolve, reject) => {
    let promise: Promise<any>;
    const contentType = resp.headers.get("Content-Type") || "";
    if (!resp.bodyUsed) {
      promise = Promise.resolve(null);
    } else if (/json/.test(contentType)) {
      promise = resp.json();
    } else if (/text/.test(contentType)) {
      promise = resp.text();
    } else {
      promise = resp.blob();
    }

    promise
      .then(data => {
        resolve(new DataServiceResponse<T>(resp.status, resp.headers, data));
      })
      .catch(reject);
  });
}
