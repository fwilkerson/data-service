import { DataService } from "./DataService";

const dataService = new DataService();

it("should request data from the remote", () => {
  dataService.get("/some-api");
});
