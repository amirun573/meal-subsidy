"use client";
import Navbar from "@/Components/Navbar";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { DisplayAlert } from "@/_Common/function/Error";
import { GetLocalStorageDetails, HandleUnAuthorized } from "@/_Common/function/LocalStorage";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import { SubsidyEmployeeUpdate } from "@/_Common/interface/subsidy.interface";
import { EmployeeUpdateSubsidyValidation, UpdateSubsidyCreditRealTimeValidation } from "@/_Common/validation/subsidy.validation";
import { CreateUpdateEmployeeValidation, UpdateEmployeeStatusValidation, UserPaginationValidation } from "@/_Common/validation/user.validation";
import { CostCenter, Department, EmployeeCategory, Subsidy, User } from "@prisma/client";
import axios from "axios";
import { Modal } from "flowbite-react";
import { Suspense, useEffect, useState } from "react";
import Spinner from '../../Components/Spinner/index';
import { CreateUpdateUser } from "@/_Common/interface/user.interface";
import { DepartmentLists } from "@/_Common/interface/department.interface";
import { FormatDepartmentCode } from "@/_Common/function/String";
import { FolderArrowDownIcon } from '@heroicons/react/24/solid'
import { MainContent } from "@/Components/Main";
import { FileMimeType } from "@/_Common/enum/file-type.enum";
import { ConvertToUTCEndOfDay, ConvertToUTCStartOfDay } from '../../_Common/function/Date';
import { encrypt } from "@/_Common/function/Hashing";
import ToggleSwitch from '../../Components/Toggle/index';
import { UpdateStatusRequest } from "@/_Common/interface/general.interface";
import { UpdateSubsidyCreditRequest } from '../../_Common/interface/subsidy.interface';

interface EmployeeDetails {
    name: string,
    employee_id: string,
    department_code: string,
    department_name: string,
    is_meal_subsidiry_active: boolean,
    meal_subsidiry_uuid: string,
    uuid: string,
    email?: string,
    employee_category_code: string;
    cost_center_code: string;
    access_card_no: string;
    employee_category_name: string;
    start_date?: string;
    end_date?: string;
    user_active: boolean;
    current_subsidy_value: number;
    subsidy_uuid: string;

}

interface EmployeeCategoryLists {
    employee_category_code: string,
    employee_category_name: string,
}

interface CostCenterLists {
    cost_center_code: string,
    description?: string,
}

const EmployeeDetailsPage = () => {

    const [currentPage, setCurrentPage] = useState<number>(1); // State variable to store current page
    const [filter, setFilter] = useState<string>('');
    const [totalItems, setTotalItems] = useState<number>(0); // State variable to store total number of items
    const [userDetailLocal, setUserDetailLocal] = useState<UserDetailsLocalStorage>();
    const [employeesDetails, setEmployeeDetails] = useState<EmployeeDetails[]>([]);
    const [openModalAddBooking, setOpenModalAddBooking] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [employeeCategories, setEmployeeCategories] = useState<EmployeeCategoryLists[]>([]);

    const initial: CreateUpdateUser = {
        name: '',
        employee_id: '',
        submit_method: 'post',
        department_name: '',
        code: StatusAPICode.CREATE_EMPLOYEE,
        email: '',
        password: '',
        confirmPassword: '',
        employee_category_name: '',
        department_code: '',
        employee_category_code: '',
        cost_center_code: '',
        access_card_no: '',
        subsidy_meal_applicable: 'yes',
    }
    const [initializeSubmitDetails, setInitializeSubmitDetails] = useState<CreateUpdateUser>(initial);

    const [departments, setDepartments] = useState<DepartmentLists[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenterLists[]>([]);

    const [openModalUploadFile, setOpenModalUploadFile] = useState<boolean>(false);
    const [isOpenModalUploadFile, setIsOpenodalUploadFile] = useState(false);
    const [isOpenModalEditSubsidyCredit, setIsOpenodalEditSubsidyCredit] = useState(false);

    const [currentEditEmployeeDetails, setCurrentEditEmployeeDetails] = useState<EmployeeDetails>();


    const GetEmployee = async () => {
        setLoading(true);
        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }

            await UserPaginationValidation({
                page: currentPage,
                filter,
            });

            setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);
            const requestBooking = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_EMPLOYEE_DETAILS}&page=${currentPage}&filter=${filter}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            const employeeDetailsResponse: EmployeeDetails[] = [];


            if (requestBooking.data?.employees) {
                const users: User[] = requestBooking.data?.employees as User[];

                users.map(user => {

                    const subsidies = ((user as any)?.subsidies as Subsidy[]).find(subsidy => (subsidy as any).subsidy_type?.subsidy_type_code === SubsidyTypeCode.meal);

                    const employee: EmployeeDetails = {
                        name: String((user as any)?.UserDetails?.name).toUpperCase(),
                        employee_id: user.employee_id,
                        department_code: (user as any)?.department?.department_code,
                        department_name: (user as any)?.department?.department_name,
                        is_meal_subsidiry_active: subsidies?.applicable as boolean || false,
                        meal_subsidiry_uuid: (subsidies as any)?.subsidy_type?.uuid || '',
                        start_date: (subsidies as any)?.start_date ? new Date((subsidies as any)?.start_date).toISOString().split('T')[0] : '',
                        end_date: (subsidies as any)?.end_date ? new Date((subsidies as any)?.end_date).toISOString().split('T')[0] : '',
                        uuid: user?.uuid || '',
                        email: user?.email || '',
                        employee_category_name: (user as any)?.employee_category?.employee_category_name || '',
                        employee_category_code: (user as any)?.employee_category?.employee_category_code || '',
                        cost_center_code: (user as any)?.cost_center?.cost_center_code || '',
                        access_card_no: (user as any)?.access_cards[0]?.card_value || '',
                        user_active: user?.active || false,
                        current_subsidy_value: (subsidies as any)?.amount || 0,
                        subsidy_uuid: subsidies?.uuid || '',
                    }

                    employeeDetailsResponse.push(employee);
                });


            }

            setEmployeeDetails(employeeDetailsResponse.length > 0 ? employeeDetailsResponse : []);

            setTotalItems(requestBooking.data?.totalItems as number);


            // setBooking(requestBooking.data?.booking as Partial<Booking[]>);
        } catch (error: any) {
            console.error(error);
            alert(error?.response?.data?.message || error?.message || "Something Goes Wrong");
            await HandleUnAuthorized(error);
        } finally {
            setLoading(false);
        }
    }

    const GetDepartment = async () => {

        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }
            const requestDepartments = await axios.get(`/api/department?${StatusAPICode.code}=${StatusAPICode.GET_DEPARTMENT_LISTS}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            if (!requestDepartments.data?.departments) {
                throw Error("No Departments Data Retreived");
            }

            const departmentsLists: Partial<Department>[] = requestDepartments.data?.departments as Partial<Department>[];

            const departmentsArray: DepartmentLists[] = [];

            departmentsLists.map(department => {
                const depart: DepartmentLists = {
                    department_code: department?.department_code || '',
                    department_name: department?.department_name || '',
                    department_uuid: department?.uuid || ''
                }

                departmentsArray.push(depart);
            });

            setDepartments(departmentsArray);

        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error)
        }
    }

    const GetCostCenter = async () => {

        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }
            const requestDepartments = await axios.get(`/api/department?${StatusAPICode.code}=${StatusAPICode.GET_COST_CENTER_LISTS}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            if (!requestDepartments.data?.costCenterLists) {
                throw Error("No Departments Data Retreived");
            }

            const costCenterLists: Partial<CostCenter>[] = requestDepartments.data?.costCenterLists as Partial<CostCenter>[];

            const costCenterArray: CostCenterLists[] = [];

            costCenterLists.map(item => {
                const costCenter: CostCenterLists = {
                    cost_center_code: item?.cost_center_code || '',
                    description: item?.cost_center_description || '',
                }

                costCenterArray.push(costCenter);
            });

            setCostCenters(costCenterArray);

        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error)
        }
    }

    const GetEmployeeCategory = async () => {
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }

            const requestEmployeeCategory = await axios.get(`/api/department?${StatusAPICode.code}=${StatusAPICode.GET_EMPLOYEE_CATEGORY_LISTS}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            if (!requestEmployeeCategory.data?.employeeCategories) {
                throw Error("No Employee Categories Been Retreived");
            }

            const employeeCategory: Partial<EmployeeCategory>[] = requestEmployeeCategory.data?.employeeCategories as Partial<EmployeeCategory>[];

            const employeeCategoryArray: EmployeeCategoryLists[] = [];


            employeeCategory.map(category => {
                const employeeCategory: EmployeeCategoryLists = {
                    employee_category_code: category.employee_category_code || '',
                    employee_category_name: category.employee_category_name || '',
                };

                employeeCategoryArray.push(employeeCategory);

            });

            setEmployeeCategories(employeeCategoryArray);


        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error);
        }
    }

    const handlePageChange = (page: number) => {
        // Update the current page state
        setCurrentPage(page);

        // Fetch data for the new page using the page number and other parameters as needed
        GetEmployee();
    };



    const ModalUser = () => {


        const [submitDetails, setSubmitDetails] = useState<CreateUpdateUser>(initializeSubmitDetails);

        interface StepperInterface {

            stepID: string,
            stepNumber: number,
            title: string,
            details: string,

        }
        const Stepper = ({ steps, currentStep, setCurrentStep }: { steps: StepperInterface[], currentStep: number, setCurrentStep: (index: number) => void }) => {
            const steppes = steps as StepperInterface[];
            return (
                <div className="flex flex-wrap items-center mb-4 gap-2">
                    {steppes.map((step, index: number) => (
                        <div key={index} className="flex items-center">
                            <button
                                className={`px-4 py-2 rounded text-sm sm:text-base md:text-lg lg:text-xl ${index === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => setCurrentStep(index)}
                            >
                                {step.title}
                            </button>
                            {index < steppes.length - 1 && (
                                <div className={`h-1 w-10 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            )}
                        </div>
                    ))}
                </div>
            );
        };

        const [currentStep, setCurrentStep] = useState(0);
        const [loading, setLoading] = useState(false);


        const prevStep = () => {
            setCurrentStep((prevStep) => prevStep - 1);
        };

        const nextStep = () => {

            setCurrentStep((prevStep) => prevStep + 1);
        };

        enum Step {
            employee_details = 'employee_details',
            password = 'password',
            setup_date = 'setup_date',
            confirmation = 'confirmation',
        }

        const steps = [
            {
                stepID: Step.employee_details,
                stepNumber: 1,
                title: "Employee Details",
                details: "Enter Employee Details.",
            },
            {
                stepID: Step.password,
                stepNumber: 2,
                title: "Password Details",
                details: "Enter Password Details.",
            },
            {
                stepID: Step.setup_date,
                stepNumber: 3,
                title: "Date Setup",
                details: "Enter Date Setup.",
            },
            {
                stepID: Step.confirmation,
                stepNumber: 4,
                title: "Confirmation Employee Details",
                details: "Submit Employee Details.",
            },
        ];

        const handleInputChange = async (e: any) => {
            const { name, value } = e.target;

            try {

                console.log("Name==>", name, ".Value==>", value);
                setSubmitDetails(prevState => ({
                    ...prevState,
                    [name]: value
                }));

            } catch (error: any) {
                console.error(error);
                alert(error?.response?.data?.message || error?.message || "Something Incorrect");
                await HandleUnAuthorized(error);
            }
        };



        const handleSubmit = async () => {
            setLoading(true);

            try {

                const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                if (!userDetailsLocalStorage) {
                    await HandleUnAuthorized(null);
                }

                const findEmployeeCategory: EmployeeCategoryLists | undefined = employeeCategories.find(category => submitDetails.employee_category_name.trim() === category.employee_category_name.trim());

                if (!findEmployeeCategory) {
                    throw Error("Cannot Find Employee Category Code.");
                }

                const findDepartment: DepartmentLists | undefined = departments.find(department => submitDetails.department_name.trim() === department.department_name.trim());

                if (!findDepartment) {
                    throw Error("Cannot Find Department Code.");
                }

                submitDetails.employee_category_code = findEmployeeCategory.employee_category_code;
                submitDetails.department_code = findDepartment.department_code;

                if (submitDetails.start_date) {
                    submitDetails.start_date = ConvertToUTCStartOfDay(submitDetails.start_date);
                }

                if (submitDetails.end_date) {
                    submitDetails.end_date = ConvertToUTCEndOfDay(submitDetails.end_date);
                }

                await CreateUpdateEmployeeValidation(submitDetails);

                if (submitDetails.submit_method === 'post') {
                    const requestCreateEmployee = await axios.post(`/api/user`, submitDetails, {
                        headers: {
                            Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                        }
                    });

                    if (!requestCreateEmployee.data?.message) {
                        throw Error("Failed To Create New Employee");
                    }

                    alert(requestCreateEmployee.data?.message);
                }

                else if (submitDetails.submit_method === 'put') {
                    const requestUpdateEmployee = await axios.put(`/api/user`, submitDetails, {
                        headers: {
                            Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                        }
                    });

                    if (!requestUpdateEmployee.data?.message) {
                        throw Error("Failed To Create New Employee");
                    }

                    alert(requestUpdateEmployee.data?.message);
                }


                window.location.reload();

            } catch (error: any) {
                console.error(error);
                alert(error?.response?.data?.message || error?.message || "Something Incorrect")
                await HandleUnAuthorized(error);
            } finally {
                setLoading(false);
            }
        }


        const renderStep = () => {

            switch (currentStep) {
                case 0: {
                    return (
                        <>
                            <h3 className="mt-10 text-lg font-medium leading-none text-gray-900 dark:text-white">Employee Details</h3>
                            <form>
                                <div className="col-span-2 sm:col-span-1">
                                    <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                        <div className="mt-4">
                                            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={submitDetails.name}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="John"
                                                required
                                            />
                                        </div>


                                        <div className="mt-4">
                                            <label htmlFor="employee_id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee ID</label>
                                            <input
                                                type="text"
                                                name="employee_id"
                                                id="employee_id"
                                                value={submitDetails.employee_id}

                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="Ek1233"
                                                required
                                            />
                                        </div>



                                        <div className="mt-4">
                                            <label htmlFor="department_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</label>
                                            <select
                                                id="department_name"
                                                name="department_name"
                                                value={submitDetails.department_name}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select a department</option>
                                                {departments.map((department, index) => (
                                                    <option key={index} value={department.department_name}>
                                                        {department.department_name}
                                                    </option>
                                                ))}
                                            </select>


                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="cost_center_code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Value Stream</label>
                                            <select
                                                id="cost_center_code"
                                                name="cost_center_code"
                                                value={submitDetails.cost_center_code}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select a Value Stream</option>
                                                {costCenters.map((item, index) => (
                                                    <option key={index} value={item.cost_center_code}>
                                                        {item.cost_center_code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="employee_category_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee Category</label>
                                            <select
                                                id="employee_category_name"
                                                name="employee_category_name"
                                                value={submitDetails.employee_category_name}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select a Employee Category</option>
                                                {employeeCategories.map((department, index) => (
                                                    <option key={index} value={department.employee_category_name}>
                                                        {department.employee_category_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={submitDetails.email}

                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="watlow@watlow.com"
                                                required
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="access_card_no" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Access Card No</label>
                                            <input
                                                type="text"
                                                name="access_card_no"
                                                id="access_card_no"
                                                value={submitDetails.access_card_no}

                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="12121212"
                                                required
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="subsidy_meal_applicable" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subsidy Meal Applicable</label>
                                            <select
                                                id="subsidy_meal_applicable"
                                                name="subsidy_meal_applicable"
                                                value={submitDetails.subsidy_meal_applicable}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            >
                                                <option value="" disabled>Select a Condition Subsidy Meal</option>
                                                <option key={1} value={'yes'}>
                                                    {'Yes'}
                                                </option>
                                                <option key={0} value={'no'}>
                                                    {'No'}
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>




                        </>
                    );
                }
                case 1: {
                    return (
                        <>
                            <h3 className="mt-10 text-lg font-medium leading-none text-gray-900 dark:text-white">Employee Details</h3>
                            <form>
                                <div className="col-span-2 sm:col-span-1">
                                    <div className="grid gap-4 mb-4 sm:grid-cols-2">


                                        <div className="mt-4">
                                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                            <input
                                                type="text"
                                                name="password"
                                                id="password"
                                                value={submitDetails.password}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="Abc@1234567"
                                                required
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                id="confirmPassword"
                                                value={submitDetails.confirmPassword}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="Abc@1234567"
                                                onPaste={(e) => e.preventDefault()}  // Prevent paste
                                                required
                                            />
                                        </div>


                                    </div>
                                </div>
                            </form>




                        </>
                    );
                }
                case 2: {
                    return (
                        <>
                            <h3 className="mt-10 text-lg font-medium leading-none text-gray-900 dark:text-white">Setup Date Details</h3>
                            <form>
                                <div className="col-span-2 sm:col-span-1">
                                    <div className="grid gap-4 mb-4 sm:grid-cols-2">


                                        <div className="mt-4">
                                            <label htmlFor="start_date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start Date</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                id="start_date"
                                                value={submitDetails.start_date} // Display the selected date
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]} // Disable previous dates
                                                required
                                            />

                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="end_date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End Date</label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                id="start_date"
                                                value={submitDetails.end_date} // Display the selected date
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]} // Disable previous dates
                                                required
                                            />
                                        </div>


                                    </div>
                                </div>
                            </form>




                        </>
                    );
                }
                case 3: {
                    return (
                        <>
                            <h3 className="mt-10 text-lg font-medium leading-none text-gray-900 dark:text-white">Employee Details</h3>
                            <div className="col-span-2 sm:col-span-1">
                                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                    <div className="mt-4">
                                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={submitDetails.name}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />
                                    </div>


                                    <div className="mt-4">
                                        <label htmlFor="employee_id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee ID</label>
                                        <input
                                            type="text"
                                            name="employee_id"
                                            id="employee_id"
                                            value={submitDetails.employee_id}

                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />
                                    </div>



                                    <div className="mt-4">
                                        <label htmlFor="department_code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department</label>

                                        <input
                                            type="text"
                                            name="department_code"
                                            id="department_code"
                                            value={(submitDetails.department_name)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="cost_center_code" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Value Stream</label>

                                        <input
                                            type="text"
                                            name="cost_center_code"
                                            id="cost_center_code"
                                            value={(submitDetails.cost_center_code)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={submitDetails.email}

                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="employee_category_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee Category</label>

                                        <input
                                            type="text"
                                            name="employee_category_name"
                                            id="employee_category_name"
                                            value={(submitDetails.employee_category_name)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="employee_category_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Access Card No</label>

                                        <input
                                            type="text"
                                            name="access_card_no"
                                            id="access_card_no"
                                            value={(submitDetails.access_card_no)}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="subsidy_meal_applicable" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subsidy Meal Applicable</label>

                                        <input
                                            type="text"
                                            name="subsidy_meal_applicable"
                                            id="subsidy_meal_applicable"
                                            value={(submitDetails.subsidy_meal_applicable === 'yes' ? 'Yes' : 'No')}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="subsidy_meal_applicable" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start Date</label>

                                        <input
                                            type="text"
                                            name="subsidy_meal_applicable"
                                            id="subsidy_meal_applicable"
                                            value={submitDetails.start_date}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="subsidy_meal_applicable" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End Date</label>

                                        <input
                                            type="text"
                                            name="subsidy_meal_applicable"
                                            id="subsidy_meal_applicable"
                                            value={submitDetails.end_date}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />

                                    </div>
                                </div>
                            </div>



                        </>
                    );
                }
                default:
                    return null;
            }
        };

        return (
            <>

                {openModalAddBooking && (
                    <div className="relative">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setOpenModalAddBooking(true)}
                        >
                            Employee Details
                        </button>
                        {openModalAddBooking && (
                            <div
                                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                onClick={() => setOpenModalAddBooking(false)} // Close modal on overlay click
                            >
                                <div
                                    className="bg-white rounded-lg shadow-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-6 relative mx-4"
                                    onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
                                >
                                    <button
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-semibold"
                                        onClick={() => setOpenModalAddBooking(false)}
                                        aria-label="Close modal"
                                    >
                                        &times;
                                    </button>

                                    <div className="mb-4">
                                        <Stepper steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
                                    </div>

                                    <div className="overflow-y-auto max-h-[70vh]">
                                        {renderStep()}
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between mt-4">
                                        <div>
                                            {currentStep <= 0 ? (
                                                <button
                                                    type="button"
                                                    className="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                                    disabled
                                                >
                                                    Previous Step
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                                    onClick={prevStep}
                                                >
                                                    Previous Step
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-4 sm:mt-0">
                                            {currentStep < steps.length - 1 ? (
                                                <button
                                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                                    onClick={nextStep}
                                                >
                                                    Next Step
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                                    onClick={handleSubmit}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Loading...' : 'Submit'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>



                )}
            </>

        );

    }

    const HandleCloseModalUploadFile = () => {
        setIsOpenodalUploadFile(false);
    };


    const ModalUploadUser = () => {

        const [selectedFile, setSelectedFile] = useState<File | null>(null);

        const HandleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                const fileType = file.type;
                if (fileType !== FileMimeType.XLSX) {
                    alert('Please upload a valid .xlsx file');
                    event.target.value = ''; // Clear the input
                    return;
                }

                console.log("event.target.files===>", file);
                setSelectedFile(file);

                // Proceed with handling the file
                console.log('File is valid:', file);
                // Add your file processing logic here


            }
        };


        // Handle file submission
        const HandleSubmit = async () => {
            setLoading(true);
            try {
                if (!selectedFile) {
                    alert('Please select a file to upload');
                    return;
                }

                // Create FormData object
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('code', StatusAPICode.UPLOAD_EXCEL_EMPLOYEE_CREATE.toString());


                // Post request to API
                const response = await axios.post('/api/user', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userDetailLocal?.accessToken}`,

                    },
                });

                // Handle the response
                console.log('File uploaded successfully:', response.data);
                alert(`File ${selectedFile.name} uploaded successfully!`);

                // Close the modal and reset the file
                setOpenModalAddBooking(false);
                setSelectedFile(null);

                window.location.reload();
            } catch (error) {
                console.error(error);
                DisplayAlert(error);
                await HandleUnAuthorized(error);
            } finally {
                setLoading(false);
            }

        };


        return (
            <>
                {isOpenModalUploadFile && (
                    <div className="flex items-center justify-center h-screen">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setIsOpenodalUploadFile(true)}
                        >
                            Upload File
                        </button>


                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg w-96 p-6">
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h2 className="text-xl font-semibold text-gray-700">Upload File</h2>
                                    <button
                                        className="text-gray-400 hover:text-gray-600"
                                        onClick={HandleCloseModalUploadFile}
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div className="flex flex-col items-center space-y-4">
                                    <label
                                        htmlFor="fileUpload"
                                        className="text-gray-600 font-medium"
                                    >
                                        Select a file to upload:
                                    </label>
                                    <input
                                        type="file"
                                        id="fileUpload"
                                        className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                        onChange={HandleFileChange}
                                        accept=".xlsx"
                                    />

                                    {selectedFile && (
                                        <p className="text-sm text-green-500 mt-2">
                                            Selected file: {selectedFile.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                                        onClick={HandleCloseModalUploadFile}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                        onClick={HandleSubmit}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </>

        );
    }

    const HandleCloseModalEditSubsidyCredit = () => {
        setIsOpenodalEditSubsidyCredit(false);
    };


    const HandleEditSubsidyCredit = (uuid: any) => {
        try {

            const employee: EmployeeDetails | undefined = employeesDetails.find(item => item.uuid === uuid);


            if (!employee) {
                throw Error("No Employee Found From ID");
            }


            setCurrentEditEmployeeDetails(employee);
            setIsOpenodalEditSubsidyCredit(true);
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        }

    }

    const ModalEditSubsidyCredit = () => {



        const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | undefined>(currentEditEmployeeDetails);

        const HandleAmountCredit = (event: React.ChangeEvent<HTMLInputElement>) => {
            try {
                const value = parseFloat(event.target.value);
                const validValue = isNaN(value) ? 0 : value;

                if (employeeDetails) {
                    const updatedEmployeeDetails = { ...employeeDetails, current_subsidy_value: validValue };
                    setEmployeeDetails(updatedEmployeeDetails);
                }
            } catch (error) {
                console.error(error);
                DisplayAlert(error);
            }
        };


        const HandleSubmit = async () => {
            setLoading(true);
            try {

                if (employeeDetails) {

                    const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                    if (!userDetailsLocalStorage) {
                        await HandleUnAuthorized(null);
                    }


                    const data: UpdateSubsidyCreditRequest = {
                        amount: employeeDetails?.current_subsidy_value || 0,
                        code: StatusAPICode.UPDATE_SUBSIDY_CREDIT_REAL_TIME,
                        user_uuid: employeeDetails.uuid,
                        subsidy_uuid: employeeDetails.subsidy_uuid,
                    }

                    console.log("data==>", data);

                    await UpdateSubsidyCreditRealTimeValidation(data);

                    const requestUpdateSubsidyCredit = await axios.put(`/api/subsidy`, data, {
                        headers: {
                            Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                        }
                    });

                    if (!requestUpdateSubsidyCredit.data?.message) {
                        throw Error("Cannot Retreive Message For Update");
                    }

                    alert(requestUpdateSubsidyCredit.data?.message);



                }



            } catch (error) {
                console.error(error);
                DisplayAlert(error);
            } finally {
                setLoading(false);

            }
        }

        return (
            <>
                {isOpenModalEditSubsidyCredit && (
                    <div className="flex items-center justify-center h-screen">
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setIsOpenodalEditSubsidyCredit(true)}
                        >
                            Subsidy Credit
                        </button>


                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg w-96 p-6">
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h2 className="text-xl font-semibold text-gray-700">Edit Subsidy Credit</h2>
                                    <button
                                        className="text-gray-400 hover:text-gray-600"
                                        onClick={HandleCloseModalEditSubsidyCredit}
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div className="flex flex-col items-center space-y-4">
                                    <label
                                        htmlFor="amount"
                                        className="text-gray-600 font-medium"
                                    >
                                        (RM)
                                    </label>
                                    <input
                                        type="text"
                                        id="amount"
                                        className="border border-gray-300 rounded-md px-4 py-2 w-full text-black"
                                        onChange={e => HandleAmountCredit(e)}
                                        value={employeeDetails?.current_subsidy_value || 0}
                                    />


                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                                        onClick={HandleCloseModalUploadFile}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                        onClick={HandleSubmit}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </>

        );
    }



    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Add event listener for window resize
        window.addEventListener('resize', handleResize);

        // Immediately call handleResize to set the initial state
        handleResize();

        // Async function to fetch data
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch data sequentially
                await GetEmployee();
                await GetDepartment();
                await GetEmployeeCategory();
                await GetCostCenter();
            } catch (error) {
                console.error(error);
                DisplayAlert(error);
            } finally {
                setLoading(false); // Ensure loading is turned off
            }
        };

        fetchData();

        // Cleanup function to remove event listener
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []); // Empty dependency array ensures this runs only once

    useEffect(() => {
        const fetchData = async () => {
            if (filter) {
                setLoading(true);
                try {
                    await GetEmployee(); // Fetch employee data
                } catch (error) {
                    console.error(error);
                    DisplayAlert(error);
                } finally {
                    setLoading(false); // Ensure loading is turned off
                }
            }
        };

        fetchData();

    }, [filter]); // Runs when `filter` changes

    const HandleAddUser = () => {
        initializeSubmitDetails.code = StatusAPICode.CREATE_EMPLOYEE;
        initializeSubmitDetails.submit_method = 'post';
        setInitializeSubmitDetails(initializeSubmitDetails);
        setOpenModalAddBooking(true);
    }

    const HandleEditUser = (uuid: string) => {
        try {

            const employee: EmployeeDetails | undefined = employeesDetails.find(item => item.uuid === uuid);


            if (!employee) {
                throw Error("No Employee Found From ID");
            }

            const updateEmployee: CreateUpdateUser = {
                name: employee?.name || '',
                employee_id: employee.employee_id,
                submit_method: 'put',
                department_name: employee.department_name,
                code: StatusAPICode.UPDATE_EMPLOYEE,
                email: employee?.email || '',
                password: '',
                confirmPassword: '',
                employee_category_name: employee.employee_category_name,
                department_code: employee.department_code,
                employee_category_code: employee.employee_category_code,
                cost_center_code: employee.cost_center_code,
                access_card_no: employee.access_card_no,
                subsidy_meal_applicable: employee.is_meal_subsidiry_active ? 'yes' : 'no',
                start_date: employee.start_date,
                end_date: employee.end_date
            }

            console.log("updateEmployee===>", updateEmployee);
            setInitializeSubmitDetails(updateEmployee);
            setOpenModalAddBooking(true);
        } catch (error) {

        }

    }

    const HandleUserUploadFileAction = () => {
        setIsOpenodalUploadFile(true)
    }

    const HandleCheckboxChange = async (e: any, index: number) => {
        setLoading(true);
        try {
            const isChecked: boolean = e.target.checked;



            // Update the specific item in the array using the index
            const updatedEmployees = [...employeesDetails];
            updatedEmployees[index] = {
                ...updatedEmployees[index],
                is_meal_subsidiry_active: isChecked,
            };

            const employee: EmployeeDetails = (updatedEmployees[index]);

            const body: SubsidyEmployeeUpdate = {
                uuid: employee.uuid,
                applicable: isChecked,
                [StatusAPICode.code]: StatusAPICode.UPDATE_APPLICABLE_SUBSIDY,
                subsidy_uuid: employee.meal_subsidiry_uuid
            }

            await EmployeeUpdateSubsidyValidation(body);


            const updateSubsidyEmployee = await axios.put(`/api/subsidy`, body,
                {
                    headers: {
                        Authorization: `Bearer ${userDetailLocal?.accessToken}`,
                    }
                }
            );

            if (!updateSubsidyEmployee.data?.updateSubsidy) {
                throw Error("Cannot Retreive Response for Update Subsidy");
            }

            alert("Successfully Update Subsidy");


            // Update the state with the modified array
            setEmployeeDetails(updatedEmployees);

            // Optionally log or handle other logic
            console.log(`Checkbox at index ${index} is now: ${isChecked}`);

            // Make an API call to update the value

            return;

        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);

        }
    }

    const HandleTriggerCredit = async () => {
        setLoading(true);
        try {
            // Post request to API
            const response = await axios.post('/api/subsidy', {
                [StatusAPICode.code]: StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT,
                key: encrypt(`TRIGGER_CREDIT`),
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userDetailLocal?.accessToken}`,

                },
            });

            alert("Successfully Generate Subsidy Credit");
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error);
        } finally {
            setLoading(false);
        }
    }

    const HandleToggleEmployeeStatus = async (status: boolean, index: number, uuid?: string) => {
        setLoading(true);
        try {

            if (uuid) {

                // Update the specific item in the array using the index
                const updatedEmployees = [...employeesDetails];
                updatedEmployees[index] = {
                    ...updatedEmployees[index],
                    user_active: status,
                };

                const employee: EmployeeDetails = (updatedEmployees[index]);

                if (!employee) {
                    throw Error("No Employee Can Be Found");
                }

                const updateUser: UpdateStatusRequest = {
                    code: StatusAPICode.UPDATE_USER_ACTIVE_STATUS,
                    uuid: employee.uuid,
                    active_status: employee.user_active
                };

                console.log("Update User==>", updateUser);

                await UpdateEmployeeStatusValidation(updateUser);

                const requestUpdateUserStatus = await axios.put(`/api/user`, updateUser, {
                    headers: {
                        Authorization: `Bearer ${userDetailLocal?.accessToken}`,
                    }
                });

                if (!requestUpdateUserStatus.data?.message) {
                    throw Error("Failed TO Update Employee Status");
                }

                alert(requestUpdateUserStatus.data?.message);


                setEmployeeDetails(updatedEmployees);




            }

            else {
                throw Error("Employee ID not found");
            }


        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error);
        } finally {
            setLoading(false);
        }
    }




    return (<>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                <div>
                    {loading && <Spinner />}

                    <h1 className="text-black">Employee Details</h1>
                    <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4">
                        <label
                            htmlFor="filter"
                            className="text-gray-900 text-sm dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                            Search:
                        </label>
                        <input
                            id="filter"
                            name="filter"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500 w-full sm:w-auto"
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <div className="flex space-x-2 sm:space-x-4">
                            <button
                                onClick={HandleAddUser}
                                className="bg-blue-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                            >
                                +
                            </button>
                            <button
                                onClick={HandleUserUploadFileAction}
                                className="bg-blue-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full sm:w-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 64 64" fill="none">
                                    <rect x="4" y="14" width="56" height="36" rx="4" fill="#f5c38c" />
                                    <path d="M4 14h20l4-4h32v36H4V14z" fill="#f5c38c" />
                                    <rect x="8" y="22" width="48" height="24" rx="2" fill="#fff" />
                                </svg>
                            </button>
                            <button
                                onClick={HandleTriggerCredit}
                                className="bg-red-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto"
                            >
                                Trigger Credit
                            </button>
                        </div>
                    </div>







                    <div className="mt-7">
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            No.
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Name
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Employee ID
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Department
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Value Stream
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Employee Category
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Meal Subsidiry Applicable
                                        </th>
                                        <th scope="col" className="px-6 py-3">Current Subsidy Credit (RM)</th>
                                        <th scope="col" className="px-6 py-3">Active</th>
                                        <th scope="col" className="px-6 py-3">Edit</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {employeesDetails && employeesDetails.length > 0 ?
                                        employeesDetails.map((item, index) => (
                                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {index + 1 + (currentPage - 1) * 10}                                                </th>
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {item?.name}
                                                </th>
                                                <td className="px-6 py-4">
                                                    {item.employee_id}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.department_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.cost_center_code}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.employee_category_code.toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4 flex justify-center items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.is_meal_subsidiry_active}
                                                        onChange={(e) => HandleCheckboxChange(e, index)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.current_subsidy_value}
                                                    <button
                                                        onClick={() => HandleEditSubsidyCredit(item.uuid || '')}
                                                        className="ml-2 bg-blue-500 text-white px-2 py-1 text-sm rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ToggleSwitch status={item.user_active} index={index} HandleToggleStatus={HandleToggleEmployeeStatus} uuid={item.uuid} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                                        onClick={() => HandleEditUser(item?.uuid as string || '')}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>


                                            </tr>
                                        )) : <tr></tr>}
                                </tbody>

                            </table>
                            <nav className="flex items-center flex-column flex-wrap md:flex-row justify-between pt-4" aria-label="Table navigation">
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mb-4 md:mb-0 block w-full md:inline md:w-auto">
                                    Showing <span className="font-semibold text-gray-900 dark:text-white">{currentPage * 10 - 9}-{Math.min(currentPage * 10, totalItems)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
                                </span>
                                <ul className="inline-flex -space-x-px rtl:space-x-reverse text-sm h-8">
                                    <li>
                                        <a
                                            onClick={() => handlePageChange(currentPage - 1 <= 0 ? 1 : currentPage - 1)}
                                            className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                        >Previous
                                        </a>
                                    </li>
                                    {/* Render pagination buttons based on totalItems and currentPage */}
                                    {Array.from({ length: Math.ceil(totalItems / 10) }, (_, index) => (
                                        <li key={index}>
                                            <a className={`flex items-center justify-center px-3 h-8 leading-tight ${currentPage === index + 1 ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-white'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`} onClick={() => handlePageChange(index + 1)}>
                                                {index + 1}
                                            </a>
                                        </li>
                                    ))}
                                    <li>
                                        <a
                                            className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                            onClick={() => handlePageChange(currentPage + 1)}

                                        >Next</a>
                                    </li>
                                </ul>
                            </nav>
                        </div>

                    </div>
                </div>
                <div>
                    <ModalUser />
                </div>
                <div>
                    <ModalUploadUser />
                </div>
                <div>
                    <ModalEditSubsidyCredit />
                </div>
            </div>
        </div>
    </>);
}


const Page = () => {
    return (
        <Suspense fallback={'...Loading'}>
            <Navbar />
            <MainContent />
            <EmployeeDetailsPage />
        </Suspense>
    );
};

export default Page;