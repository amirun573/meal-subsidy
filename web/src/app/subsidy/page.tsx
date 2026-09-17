"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Navbar from '@/Components/Navbar';
import { MainContent } from '@/Components/Main';

// Import necessary components from chart.js
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { UserDetailsLocalStorage } from '@/_Common/interface/auth.interface';
import { GetLocalStorageDetails, HandleUnAuthorized } from '@/_Common/function/LocalStorage';
import { SubsidyTransactionPagination, SubsidyTransactionReportDownload, UpdateSubsidyTypeValidation } from '@/_Common/validation/subsidy.validation';
import axios from 'axios';
import { StatusAPICode } from '@/_Common/enum/status-api-code.enum';
import { Subsidy, SubsidyTransaction, SubsidyType, User } from '@prisma/client';
import { DisplayAlert } from '@/_Common/function/Error';
import { ConvertToUTCEndOfDay, ConvertToUTCStartOfDay, HandleDateFormatToAPI, HandleDateTimeFormatToAPI } from '../../_Common/function/Date';
import Spinner from '@/Components/Spinner';

// Register the components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



const ChartComponent = () => {
    const chartRef = useRef(null);
    const [selectedRange, setSelectedRange] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('yearly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1); // State variable to store current page
    const [filter, setFilter] = useState<string>('');
    const [totalItems, setTotalItems] = useState<number>(0); // State variable to store total number of items
    const [userDetailLocal, setUserDetailLocal] = useState<UserDetailsLocalStorage>();
    const [subsidyTypes, setSubsidyTypes] = useState<Partial<SubsidyType>[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [chartData, setChartData] = useState<any>(null);
    const [isOpenModalUpdateSubsidyType, setIsOpenodalUpdateSubsidyType] = useState<boolean>(false);

    const [updatesubsidyTypes, setUpdateSubsidyTypes] = useState<Partial<SubsidyType>>();


    interface DownloadReport {
        startDate: string;
        endDate: string;
        employee_id: string;

    }

    const initial: Partial<SubsidyType> = {
        subsidy_type_code: '', // Initialize with today's date in YYYY-MM-DD format
        subsidy_type_name: '', // Initialize with today's date in YYYY-MM-DD format
        uuid: '',
        price: 0,
        active: false,
    }

    const [initializeSubmitDownloadReportDetails, setInitializeSubmitDownloadReportDetails] = useState<Partial<SubsidyType>>(initial);

    interface SubsidyTypePagination {
        active: boolean,
        price: number,
        subsidy_type_name: string,
        subsidy_type_code: string,
        uuid: string,
    }


    const handlePageChange = (page: number) => {
        // Update the current page state
        setCurrentPage(page);

        // Fetch data for the new page using the page number and other parameters as needed
        // GetEmployee();
    };

    const GetSubsidyTransaction = async () => {
        setLoading(true);
        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }

            setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);

            await SubsidyTransactionPagination({
                page: currentPage,
                filter,
                startDate,
                endDate
            });


            const requestBooking = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.SUBSIDY_TYPE_PAGINATION}&page=${currentPage}&filter=${filter}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            const subsidyTypesArray: SubsidyTypePagination[] = [];


            if (requestBooking.data?.transactions) {
                const subsidyTypes: SubsidyType[] = requestBooking.data?.transactions as SubsidyType[];

                subsidyTypes.map(item => {



                    const subsidyTransaction: SubsidyTypePagination = {
                        active: item.active,
                        price: item.price,
                        subsidy_type_code: item?.subsidy_type_code,
                        subsidy_type_name: item?.subsidy_type_name,
                        uuid: item.uuid || '',  // The parenthesis was missing here

                    };


                    subsidyTypesArray.push(subsidyTransaction);
                });


            }

            setSubsidyTypes(subsidyTypesArray.length > 0 ? subsidyTypesArray : []);

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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                window.addEventListener('resize', handleResize);

                // Call handler right away so state gets updated with initial window size
                handleResize();

                // Fetch employee and department data sequentially
                await GetSubsidyTransaction();       // If this throws an error, the following will not execute

            } catch (error) {
                console.error(error);
                DisplayAlert(error);       // Display the error alert
            } finally {
                setLoading(false);         // Ensure loading is turned off after the operations
            }
        };


        fetchData();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);  // Empty dependency array ensures this runs only once

    useEffect(() => {
        setLoading(true)
        try {
            const fetchData = async () => {
                setLoading(true);
                try {


                    // Fetch employee and department data sequentially
                    await GetSubsidyTransaction();       // If this throws an error, the following will not execute


                } catch (error) {
                    console.error(error);
                    DisplayAlert(error);       // Display the error alert
                } finally {
                    setLoading(false);         // Ensure loading is turned off after the operations
                }
            };


            fetchData();

        } catch (error) {
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const HandleOpenModalReport = () => {

        setIsOpenodalUpdateSubsidyType(true);
    }

    const HandleCloseDownloadReport = () => {
        setIsOpenodalUpdateSubsidyType(false);
    };

    const ModalUpdateSubsidyType = () => {


        const [submitDetails, setSubmitDetails] = useState<Partial<SubsidyType>>(initializeSubmitDownloadReportDetails);


        // Handle file submission
        const HandleSubmit = async () => {
            setLoading(true);
            try {

                await UpdateSubsidyTypeValidation(submitDetails);

                const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                if (!userDetailsLocalStorage) {
                    await HandleUnAuthorized(null);
                }

                const requestUpdateEmployee = await axios.put(`/api/subsidy`, {
                    [StatusAPICode.code]: StatusAPICode.UPDATE_SUBSIDY_TYPE,
                    uuid: submitDetails.uuid,
                    price: submitDetails.price,
                    subsidy_type_code: submitDetails.subsidy_type_code,
                    subsidy_type_name: submitDetails.subsidy_type_name,
                }, {
                    headers: {
                        Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                    }
                });

                if (!requestUpdateEmployee.data?.message) {
                    throw Error("Failed To Create New Employee");
                }

                alert(requestUpdateEmployee.data?.message);

                window.location.reload();

            } catch (error) {
                console.error(error);
                DisplayAlert(error);
                await HandleUnAuthorized(error);
            } finally {
                setLoading(false);
            }
        };

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


        return (
            <>
                {isOpenModalUpdateSubsidyType && (
                    <div className="flex items-center justify-center h-screen">
                        {/* <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setIsOpenodalUpdateSubsidyType(true)}
                        >
                            Download Report
                        </button> */}


                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg w-96 p-6">
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h1 className='text-black'>Edit Subsidy Type</h1>
                                    <button
                                        className="ml-auto text-gray-400 hover:text-gray-600 text-3xl"
                                        onClick={HandleCloseDownloadReport}
                                    >
                                        &times;
                                    </button>
                                </div>


                                <div className="flex flex-col items-center space-y-4">
                                    <form>
                                        <div className="col-span-2 sm:col-span-1">
                                            <div className="grid gap-4 mb-4 sm:grid-cols-2">

                                                <div className="mt-4">
                                                    <label
                                                        htmlFor="subsidy_type_name"
                                                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                    >
                                                        Subsidy Type Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="subsidy_type_name"
                                                        id="subsidy_type_name"
                                                        value={submitDetails.subsidy_type_name} // Display the selected date
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-40 p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <label
                                                        htmlFor="subsidy_type_name"
                                                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                    >
                                                        Price (RM)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="price"
                                                        id="price"
                                                        value={submitDetails.price} // Display the selected date
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-40 p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>




                                            </div>
                                        </div>
                                    </form>

                                </div>

                                <div className="flex justify-end mt-6">

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

    const HandleEditSubsidyType = (uuid: string) => {
        try {

            const subsidyType: Partial<SubsidyType> | undefined = subsidyTypes.find(item => item.uuid === uuid);


            if (!subsidyType) {
                throw Error("No Subsidy Found From ID");
            }

            setInitializeSubmitDownloadReportDetails(subsidyType);
            setIsOpenodalUpdateSubsidyType(true);
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        }

    }

    // // Fetch the initial data when component mounts or range changes
    // useEffect(() => {
    //     fetchChartData(selectedRange);
    // }, [selectedRange]);

    // useEffect(() => {
    //     if (chartData) {
    //         updateChartData(chartData); // Update chart when data is fetched
    //     }
    // }, [chartData]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [scheduleLogs, setScheduleLogs] = useState<any[]>([]);
    const [isTriggering, setIsTriggering] = useState<string | null>(null);
    const [isOpenModalSchedule, setIsOpenModalSchedule] = useState<boolean>(false);
    const [scheduleForm, setScheduleForm] = useState<any>({
        title: '',
        schedule_type: 'ROUTINE',
        routine_frequency: 'DAILY',
        trigger_time: '08:00',
        day_of_week: 1,
        day_of_month: 1,
        start_datetime: '',
        end_datetime: '',
        amount: 0,
    });

    const FetchSchedules = async () => {
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            if (!userDetailsLocalStorage?.accessToken) return;
            const res = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.GET_SUBSIDY_SCHEDULES}`, {
                headers: { Authorization: `Bearer ${userDetailsLocalStorage.accessToken}` }
            });
            if (res.data?.schedules) {
                setSchedules(res.data.schedules);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const FetchScheduleLogs = async () => {
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            if (!userDetailsLocalStorage?.accessToken) return;
            const res = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.GET_SUBSIDY_SCHEDULE_LOGS}`, {
                headers: { Authorization: `Bearer ${userDetailsLocalStorage.accessToken}` }
            });
            if (res.data?.logs) {
                setScheduleLogs(res.data.logs);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        FetchSchedules();
        FetchScheduleLogs();
    }, []);

    const HandleTriggerSchedule = async (uuid: string) => {
        if (!confirm("Are you sure you want to manually trigger this credit schedule now?")) return;
        setIsTriggering(uuid);
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            if (!userDetailsLocalStorage?.accessToken) {
                await HandleUnAuthorized(null);
                return;
            }
            const res = await axios.post('/api/subsidy', {
                code: StatusAPICode.MANUAL_TRIGGER_SUBSIDY_SCHEDULE,
                schedule_uuid: uuid,
            }, {
                headers: { Authorization: `Bearer ${userDetailsLocalStorage.accessToken}` }
            });
            alert(res.data?.message || "Trigger action executed!");
            FetchScheduleLogs();
        } catch (error: any) {
            alert(error.response?.data?.message || "Trigger action failed");
        } finally {
            setIsTriggering(null);
        }
    };

    const HandleToggleActiveSchedule = async (uuid: string, currentActive: boolean) => {
        const nextActive = !currentActive;
        const confirmMsg = nextActive 
            ? "Activating this routine schedule will automatically deactivate any other active routine schedules. Continue?"
            : "Deactivate this schedule?";
        if (!confirm(confirmMsg)) return;

        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            if (!userDetailsLocalStorage?.accessToken) {
                await HandleUnAuthorized(null);
                return;
            }
            const res = await axios.put('/api/subsidy', {
                code: StatusAPICode.TOGGLE_SUBSIDY_SCHEDULE_ACTIVE,
                schedule_uuid: uuid,
                active: nextActive,
            }, {
                headers: { Authorization: `Bearer ${userDetailsLocalStorage.accessToken}` }
            });
            alert(res.data?.message || "Schedule status updated");
            FetchSchedules();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to update schedule status");
        }
    };

    const HandleSaveSchedule = async () => {
        setLoading(true);
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            if (!userDetailsLocalStorage?.accessToken) {
                await HandleUnAuthorized(null);
            }

            const isEdit = !!scheduleForm.uuid;
            const code = isEdit ? StatusAPICode.UPDATE_SUBSIDY_SCHEDULE : StatusAPICode.CREATE_SUBSIDY_SCHEDULE;
            const method = isEdit ? 'put' : 'post';

            const payload: any = {
                code,
                ...scheduleForm,
                amount: parseFloat(scheduleForm.amount) || 0,
                day_of_week: parseInt(scheduleForm.day_of_week) || 1,
                day_of_month: parseInt(scheduleForm.day_of_month) || 1,
            };

            if (scheduleForm.schedule_type === 'RANGE') {
                if (scheduleForm.start_datetime) payload.start_datetime = new Date(scheduleForm.start_datetime).toISOString();
                if (scheduleForm.end_datetime) payload.end_datetime = new Date(scheduleForm.end_datetime).toISOString();
            }

            const response = await axios({
                method,
                url: '/api/subsidy',
                data: payload,
                headers: { Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}` }
            });

            alert(response.data?.message || "Saved successfully");
            setIsOpenModalSchedule(false);
            setScheduleForm({
                title: '',
                schedule_type: 'ROUTINE',
                routine_frequency: 'DAILY',
                trigger_time: '08:00',
                day_of_week: 1,
                day_of_month: 1,
                start_datetime: '',
                end_datetime: '',
                amount: 0,
            });
            await FetchSchedules();
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    };

    const HandleDeleteSchedule = async (uuid: string) => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        setLoading(true);
        try {
            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;
            await axios.delete(`/api/subsidy?uuid=${uuid}`, {
                headers: { Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}` }
            });
            await FetchSchedules();
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            {loading && <Spinner />}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Subsidy Schedule Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subsidy Trigger Schedules</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure automated cronjob routines (daily/weekly/monthly) or date & time range credit triggers.</p>
                            </div>
                            <button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-sm self-start sm:self-auto flex items-center gap-2"
                                onClick={() => {
                                    setScheduleForm({
                                        title: '',
                                        schedule_type: 'ROUTINE',
                                        routine_frequency: 'DAILY',
                                        trigger_time: '08:00',
                                        day_of_week: 1,
                                        day_of_month: 1,
                                        start_datetime: '',
                                        end_datetime: '',
                                        amount: 0,
                                    });
                                    setIsOpenModalSchedule(true);
                                }}
                            >
                                + Add Schedule
                            </button>
                        </div>

                        <div className="relative overflow-x-auto shadow-sm sm:rounded-lg border border-gray-200">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Schedule Title</th>
                                        <th scope="col" className="px-6 py-3">Type</th>
                                        <th scope="col" className="px-6 py-3">Details / Routine</th>
                                        <th scope="col" className="px-6 py-3">Credit Amount (RM)</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules && schedules.length > 0 ? (
                                        schedules.map((item: any) => (
                                            <tr key={item.uuid} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {item.title}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${item.schedule_type === 'ROUTINE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                        {item.schedule_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                    {item.schedule_type === 'ROUTINE' ? (
                                                        <span>
                                                            {item.routine_frequency} at {item.trigger_time || '00:00'}
                                                            {item.routine_frequency === 'WEEKLY' && ` (Day ${item.day_of_week})`}
                                                            {item.routine_frequency === 'MONTHLY' && ` (Day ${item.day_of_month})`}
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            From {item.start_datetime ? new Date(item.start_datetime).toLocaleString() : 'N/A'}<br/>
                                                            To {item.end_datetime ? new Date(item.end_datetime).toLocaleString() : 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-green-600">
                                                    RM {parseFloat(item.amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => HandleToggleActiveSchedule(item.uuid, item.active)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${item.active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                        title="Click to toggle active status"
                                                    >
                                                        {item.active ? '● Active' : '○ Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5 py-1 rounded font-medium disabled:opacity-50"
                                                        disabled={isTriggering === item.uuid}
                                                        onClick={() => HandleTriggerSchedule(item.uuid)}
                                                    >
                                                        {isTriggering === item.uuid ? 'Triggering...' : 'Trigger Now'}
                                                    </button>
                                                    <button
                                                        className="text-blue-600 hover:underline text-xs font-medium ml-2"
                                                        onClick={() => {
                                                            setScheduleForm({
                                                                uuid: item.uuid,
                                                                title: item.title,
                                                                schedule_type: item.schedule_type,
                                                                routine_frequency: item.routine_frequency || 'DAILY',
                                                                trigger_time: item.trigger_time || '08:00',
                                                                day_of_week: item.day_of_week || 1,
                                                                day_of_month: item.day_of_month || 1,
                                                                start_datetime: item.start_datetime ? new Date(item.start_datetime).toISOString().slice(0,16) : '',
                                                                end_datetime: item.end_datetime ? new Date(item.end_datetime).toISOString().slice(0,16) : '',
                                                                amount: item.amount,
                                                            });
                                                            setIsOpenModalSchedule(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:underline text-xs font-medium ml-2"
                                                        onClick={() => HandleDeleteSchedule(item.uuid)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                No schedules configured yet. Click &quot;+ Add Schedule&quot; above to set up credit triggers.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Execution History Log Table */}
                        <div className="mt-8">
                            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Schedule Execution History Logs</h4>
                            <div className="relative overflow-x-auto shadow-sm sm:rounded-lg border border-gray-200">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Schedule</th>
                                            <th scope="col" className="px-6 py-3">Trigger Source</th>
                                            <th scope="col" className="px-6 py-3">Credit Amount</th>
                                            <th scope="col" className="px-6 py-3">Status</th>
                                            <th scope="col" className="px-6 py-3">Triggered Time (KL Time)</th>
                                            <th scope="col" className="px-6 py-3">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scheduleLogs && scheduleLogs.length > 0 ? (
                                            scheduleLogs.map((log: any) => (
                                                <tr key={log.uuid || log.subsidy_schedule_log_id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {log.subsidy_schedule?.title || 'System Cron / All'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${log.triggered_by_source === 'MANUAL' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {log.triggered_by_source}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-green-600">
                                                        RM {parseFloat(log.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                        {new Date(log.created_at || log.triggered_at).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                                        {log.notes || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    No schedule execution history recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Modal Schedule Setup */}
                    {isOpenModalSchedule && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {scheduleForm.uuid ? 'Edit Subsidy Schedule' : 'Setup Subsidy Trigger Schedule'}
                                    </h3>
                                    <button
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                        onClick={() => setIsOpenModalSchedule(false)}
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Title</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                            placeholder="e.g. Daily Morning Credit Routine"
                                            value={scheduleForm.title}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Schedule Type</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                            value={scheduleForm.schedule_type}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_type: e.target.value })}
                                        >
                                            <option value="ROUTINE">Routine Cronjob (Daily / Weekly / Monthly)</option>
                                            <option value="RANGE">Date & Time Range Trigger</option>
                                        </select>
                                    </div>

                                    {scheduleForm.schedule_type === 'ROUTINE' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                                    <select
                                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                        value={scheduleForm.routine_frequency}
                                                        onChange={(e) => setScheduleForm({ ...scheduleForm, routine_frequency: e.target.value })}
                                                    >
                                                        <option value="DAILY">Daily</option>
                                                        <option value="WEEKLY">Weekly</option>
                                                        <option value="MONTHLY">Monthly</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Time</label>
                                                    <input
                                                        type="time"
                                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                        value={scheduleForm.trigger_time}
                                                        onChange={(e) => setScheduleForm({ ...scheduleForm, trigger_time: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {scheduleForm.routine_frequency === 'WEEKLY' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week (1=Monday ... 7=Sunday)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={7}
                                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                        value={scheduleForm.day_of_week}
                                                        onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            {scheduleForm.routine_frequency === 'MONTHLY' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month (1 - 31)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={31}
                                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                        value={scheduleForm.day_of_month}
                                                        onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_month: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                    value={scheduleForm.start_datetime}
                                                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_datetime: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                                    value={scheduleForm.end_datetime}
                                                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_datetime: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Credit Amount (RM)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-black"
                                            placeholder="e.g. 10.00"
                                            value={scheduleForm.amount}
                                            onChange={(e) => setScheduleForm({ ...scheduleForm, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
                                    <button
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                        onClick={() => setIsOpenModalSchedule(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
                                        onClick={HandleSaveSchedule}
                                    >
                                        Save Schedule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </main>
        </div>
    );
};

export default ChartComponent;
