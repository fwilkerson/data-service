# Data Service

Data service is a small utility intended to remove some boilerplate that goes into making an http requests such as;

- [x] Applying a base path to each request
- [x] Applying global headers to each request
- [x] Making the request cancellable
- [x] Cancelling all inflight requests
- [x] Parsing a non Blob/FormData object to JSON & setting the content-type
- [x] Parsing the response body based on content type
- [x] Applying a request timeout

```typescript
const dataService = new DataService("/api/v1", {
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const { cancel } = dataService
  .get<User>("/some-endpoint")
  .onNext(response => {
    // do something
  })
  .onError(err => console.error("An error ocurred", error))
  .onComplete(() => console.info("Request completed"))
  .onCancel(() => console.info("Request was cancelled"));

cancel(); // cancel the request
```
