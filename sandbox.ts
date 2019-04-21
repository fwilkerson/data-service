import { DataService } from "./DataService";

const dataService = new DataService();

dataService.initialize("", { accept: "application/json" });

const { cancel } = dataService
  .get<any>("/")
  .onNext(resp => {})
  .onError(err => {});
