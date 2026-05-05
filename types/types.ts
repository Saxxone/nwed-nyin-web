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

/** Narrow return type from `useApiConnect` (and similar) to the error branch. */
export function isApiError(value: unknown): value is Error {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Error).type === "error"
  );
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

export type DateString =
  `${number}-${number}-${number}T${number}:${number}:${number}Z`;

export interface Pagination {
  take?: number;
  skip?: number;
  cursor?: string | null;
}

export interface FormatAction {
  label: string;
  icon: string;
  formatting: string;
  command: FormatCommand;
  shortcut?: string;
  /** When `command` is `"heading"`, which ATX level (1–3) to apply in the editor / markdown. */
  headingLevel?: 1 | 2 | 3;
  markdown: {
    prefix: string;
    suffix?: string;
  };
}

export type FormatCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "heading"
  | "link"
  | "code"
  | "quote"
  | "list";

export interface FileInterface {
  url: string;
}
