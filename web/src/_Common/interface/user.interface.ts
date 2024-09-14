import { StatusAPICode } from "../enum/status-api-code.enum";

export interface UserPaginationRequest {
  page: number;
  filter: string | null;
}

export interface ScanCheckEmployeeID {
  employeeID: string | null;
}

export interface CreateUpdateUser {
  user_uuid?: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  submit_method: "post" | "put";
  department_name: string;
  code: StatusAPICode;
  email: string;
  password?: string;
  confirmPassword?: string;
  employee_category_name: string;
}
