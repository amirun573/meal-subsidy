export interface UserPaginationRequest {
  page: number;
  filter: string | null;
}

export interface ScanCheckEmployeeID {
  employeeID: string | null;
}
