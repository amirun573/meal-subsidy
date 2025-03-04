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
    return (
        <>
            <Navbar />

            {loading && <Spinner />}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                    {/* Dropdown Menu */}
                    {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <select value={selectedRange} onChange={handleRangeChange} style={{ padding: '10px', backgroundColor: 'gray', color: 'black', border: 'none', borderRadius: '5px' }}>
                            <option value="yearly">Yearly</option>
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div> */}

                    {/* Bar Chart */}
                    {/* <div style={{ width: '100%', height: 'auto', flexGrow: '1', position: 'relative', aspectRatio: '2 / 1' }}>
                        {chartData && chartData[selectedRange] ? (
                            <Bar
                                ref={chartRef}
                                data={chartData[selectedRange]} // Dynamically use the selected range (monthly, yearly, etc.)
                                options={{ responsive: true, maintainAspectRatio: false }}
                            />
                        ) : (
                            <p className='text-black'>Loading chart data...</p> // Or show a placeholder when there's no data
                        )}
                    </div> */}



                    {/* Table */}
                    <div className="mt-10">
                        <p className='text-black mb-2'><strong>Subsidy Type</strong></p>

                        <div className="flex justify-end items-center space-x-4">
                            <label
                                htmlFor="filter"
                                className="text-gray-900 text-sm dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            >
                                Search:
                            </label>
                            <input
                                id="filter"
                                name="filter"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>

                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
                            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            No.
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Subsidy Name
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Price (RM)
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Edit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subsidyTypes && subsidyTypes.length > 0 ?
                                        subsidyTypes.map((item, index) => (
                                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {index + 1 + (currentPage - 1) * 10}                                                </th>
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {item?.subsidy_type_name}
                                                </th>
                                                <td className="px-6 py-4">
                                                    {item.price}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button>
                                                        <button
                                                            className="bg-blue-500 text-white px-4 py-2 rounded"
                                                            onClick={() => HandleEditSubsidyType(item?.uuid as string || '')}
                                                        >
                                                            Edit
                                                        </button>
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
                    <ModalUpdateSubsidyType />
                </div>
            </div>


        </>
    );
};

export default ChartComponent;
