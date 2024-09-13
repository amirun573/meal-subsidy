"use client";
import Navbar from "@/Components/Navbar";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { DisplayAlert } from "@/_Common/function/Error";
import { GetLocalStorageDetails, HandleUnAuthorized } from "@/_Common/function/LocalStorage";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import { SubsidyEmployeeUpdate } from "@/_Common/interface/subsidy.interface";
import { EmployeeUpdateSubsidyValidation } from "@/_Common/validation/subsidy.validation";
import { CreateUpdateEmployeeValidation, UserPaginationValidation } from "@/_Common/validation/user.validation";
import { Department, Subsidy, User } from "@prisma/client";
import axios from "axios";
import { Modal } from "flowbite-react";
import { Suspense, useEffect, useState } from "react";
import Spinner from '../../Components/Spinner/index';
import { CreateUpdateUser } from "@/_Common/interface/user.interface";
import { DepartmentLists } from "@/_Common/interface/department.interface";
import { FormatDepartmentCode } from "@/_Common/function/String";
import { FolderArrowDownIcon } from '@heroicons/react/24/solid'


interface EmployeeDetails {
    name: string,
    employee_id: string,
    department: string,
    is_meal_subsidiry_active: boolean,
    meal_subsidiry_uuid: string,
    uuid: string,
    email: string,
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


    const [initializeSubmitDetails, setInitializeSubmitDetails] = useState<CreateUpdateUser>({
        first_name: '',
        last_name: '',
        employee_id: '',
        submit_method: 'post',
        department_name: '',
        code: StatusAPICode.CREATE_EMPLOYEE,
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [departments, setDepartments] = useState<DepartmentLists[]>([]);


    const GetEmployee = async () => {
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
                        name: (user as any)?.UserDetails?.name,
                        employee_id: user.employee_id,
                        department: (user as any)?.department?.department_name,
                        is_meal_subsidiry_active: subsidies?.applicable as boolean || false,
                        meal_subsidiry_uuid: (subsidies as any)?.subsidy_type?.uuid || '',
                        uuid: user?.uuid || '',
                        email: user?.email,
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
        }
    }

    const handlePageChange = (page: number) => {
        // Update the current page state
        setCurrentPage(page);

        // Fetch data for the new page using the page number and other parameters as needed
        GetEmployee();
    };

    const handleUpdateBooking = (uuid: string) => {

        try {


            setOpenModalAddBooking(true);

        } catch (error) {
            console.error(error);
        }
    }

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
                stepID: Step.confirmation,
                stepNumber: 3,
                title: "Confirmation Employee Details",
                details: "Submit Employee Details.",
            },
        ];




        const handleInputChange = async (e: any) => {
            const { name, value } = e.target;

            try {

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
                                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                id="first_name"
                                                value={submitDetails.first_name}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="John"
                                                required
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                id="last_name"
                                                value={submitDetails.last_name}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                onChange={(e) => handleInputChange(e)}
                                                placeholder="Affendy"
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
                            <h3 className="mt-10 text-lg font-medium leading-none text-gray-900 dark:text-white">Employee Details</h3>
                            <div className="col-span-2 sm:col-span-1">
                                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                    <div className="mt-4">
                                        <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            id="first_name"
                                            value={submitDetails.first_name}
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            readOnly
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="last_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            id="last_name"
                                            value={submitDetails.last_name}
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
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Employee ID</label>
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
            <Modal show={openModalAddBooking} onClose={() => setOpenModalAddBooking(false)}>
                <Modal.Header className="bg-gray-200 text-gray-900"></Modal.Header>
                <Modal.Body className="max-h-[75vh] overflow-y-auto">
                    <Stepper steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
                    {renderStep()}
                    <div className="flex justify-between mt-3">
                        {currentStep <= 0 ?
                            <button type="button" className="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"

                                disabled={false}
                            >
                                Previous Step
                            </button> :

                            <button type="button" className="text-white-700 bg-gray-700 hover:bg-blue-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-gray-800"
                                onClick={prevStep}
                            >
                                Previous Step
                            </button>
                        }

                        {currentStep < steps.length - 1 ? (
                            <button
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mt-4"
                                onClick={nextStep}
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mt-4"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Submit'}
                            </button>
                        )}



                    </div>
                </Modal.Body>
                <Modal.Footer className="flex justify-between">
                    {/* <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setOpenModalAddBooking(false)}>Close</button> */}
                    {/* <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => setSubmitDetails(initializeSubmitDetails)}>Reset</button> */}
                    <div className="flex space-x-2">
                        {/* <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSubmit}>Submit ({(storeService as any)?.postcode?.city?.state?.country?.currency_code || 'RM'} {submitDetails.totalPrice > 0 ? `${submitDetails.totalPrice} Include Tax and Service Fee` : 0})</button> */}
                    </div>
                </Modal.Footer>
            </Modal>
        );

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

    useEffect(() => {
        setLoading(true);
        try {
            const handleResize = () => {
                setIsMobile(window.innerWidth < 768);
            };

            window.addEventListener('resize', handleResize);

            // Call handler right away so state gets updated with initial window size
            handleResize();
            GetEmployee();
            GetDepartment();
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }

    }, []);

    const HandleUserAction = () => {
        setOpenModalAddBooking(true)
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



    return (<>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                <div>
                    {loading && <Spinner />}

                    <h1 className="text-black">Employee Details</h1>
                    <div className="flex justify-end">
                        <ul className="flex space-x-2">
                            <li>
                                <button
                                    onClick={HandleUserAction}
                                    className="bg-blue-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    +
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={HandleUserAction}
                                    className="bg-blue-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 64 64" fill="none">
                                        <rect x="4" y="14" width="56" height="36" rx="4" fill="#f5c38c" />
                                        <path d="M4 14h20l4-4h32v36H4V14z" fill="#f5c38c" />
                                        <rect x="8" y="22" width="48" height="24" rx="2" fill="#fff" />
                                    </svg>
                                </button>
                            </li>
                        </ul>
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
                                            Meal Subsidiry Applicable
                                        </th>
                                        {/* <th scope="col" className="px-6 py-3">Edit</th> */}

                                    </tr>
                                </thead>
                                <tbody>
                                    {employeesDetails && employeesDetails.length > 0 ?
                                        employeesDetails.map((item, index) => (
                                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {index + 1}
                                                </th>
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {item?.name}
                                                </th>
                                                <td className="px-6 py-4">
                                                    {item.employee_id}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.department}
                                                </td>
                                                <td className="px-6 py-4 flex justify-center items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.is_meal_subsidiry_active}
                                                        onChange={(e) => HandleCheckboxChange(e, index)}
                                                    />
                                                </td>


                                                {/* <td className="px-6 py-4">
                                                    <button
                                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                                        onClick={() => handleUpdateBooking(item?.uuid as string || '')}
                                                    >
                                                        Edit
                                                    </button>
                                                </td> */}


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
            </div>
        </div>
    </>);
}


const Page = () => {
    return (
        <Suspense fallback={'...Loading'}>
            <Navbar />
            <EmployeeDetailsPage />
        </Suspense>
    );
};

export default Page;