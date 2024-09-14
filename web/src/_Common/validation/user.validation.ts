import * as yup from "yup";
import {
  UserPaginationRequest,
  ScanCheckEmployeeID,
  CreateUpdateUser,
} from "../interface/user.interface";

const PaginationEmployeeValidation = yup.object().shape({
  page: yup.string().required("Page Required"),
  filter: yup.string().optional(),
});

const ScanCheckEmployeeIDValidation = yup.object().shape({
  employeeID: yup.string().required("Employee ID Required"),
});

const CreateUpdateEmployeeValidationSchema = yup.object().shape({
  first_name: yup.string().required("First Name Required"),
  last_name: yup.string().required("Last Name Required"),
  employee_id: yup.string().required("Employee ID Required"),
  submit_method: yup.string().required("Submit Method Required"),
  department_name: yup.string().required("Department Required"),
  email: yup
    .string()
    .email("Email Format Must Be Correct")
    .required("Email Required"),
  password: yup
    .string()
    .optional()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  confirmPassword: yup
    .string()
    .optional()
    .oneOf([yup.ref("password")], "Passwords must match"),
});

export function UserPaginationValidation(data: UserPaginationRequest) {
  return PaginationEmployeeValidation.validate(data);
}

export function ScanEmployeeIDValidation(data: ScanCheckEmployeeID) {
  return ScanCheckEmployeeIDValidation.validate(data);
}

export function CreateUpdateEmployeeValidation(data: CreateUpdateUser) {
  return CreateUpdateEmployeeValidationSchema.validate(data);
}
