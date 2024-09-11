import * as yup from "yup";
import { UserPaginationRequest } from "../interface/user.interface";

const PaginationEmployeeValidation = yup.object().shape({
  page: yup.string().required("Page Required"),
  filter: yup.string().optional(),
});

export function UserPaginationValidation(data: UserPaginationRequest) {
  return PaginationEmployeeValidation.validate(data);
}
