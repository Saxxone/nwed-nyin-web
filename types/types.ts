export enum HTMLInputType {
  Text = "text",
  Textarea = "textarea",
  Select = "select",
  Option = "option",
  Password = "password",
  Email = "email",
  Number = "number",
  Date = "date",
  DatetimeLocal = "datetime-local",
  Month = "month",
  Time = "time",
  Week = "week",
  Url = "url",
  Search = "search",
  Tel = "tel",
  Color = "color",
  Checkbox = "checkbox",
  Radio = "radio",
  File = "file",
  Range = "range",
  Hidden = "hidden",
  Button = "button",
  Submit = "submit",
  Reset = "reset",
}

export enum FetchMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface Error {
  status: number;
  message: string;
  type: "error";
}

export interface Snack {
  title?: string | null;
  type: "error" | "info" | "warning" | "success";
  message: string;
  timeout?: number;
}

export enum Status {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type DateString = `${number}-${number}-${number}T${number}:${number}:${number}Z`;


export interface Pagination {
  take?: number;
  skip?: number;
  cursor?: string | null;
}