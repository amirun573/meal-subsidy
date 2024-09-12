import * as yup from "yup";
import {
  UserPaginationRequest,
  ScanCheckEmployeeID,
} from "../interface/user.interface";

const PaginationEmployeeValidation = yup.object().shape({
  page: yup.string().required("Page Required"),
  filter: yup.string().optional(),
});

const ScanCheckEmployeeIDValidation = yup.object().shape({
  employeeID: yup.string().required("Employee ID Required"),
});

export function UserPaginationValidation(data: UserPaginationRequest) {
  return PaginationEmployeeValidation.validate(data);
}

export function ScanEmployeeIDValidation(data: ScanCheckEmployeeID) {
  return ScanCheckEmployeeIDValidation.validate(data);
}
