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
import { SubsidyTransactionPagination, SubsidyTransactionReportDownload } from '@/_Common/validation/subsidy.validation';
import axios from 'axios';
import { StatusAPICode } from '@/_Common/enum/status-api-code.enum';
import { Subsidy, SubsidyTransaction, User } from '@prisma/client';
import { DisplayAlert } from '@/_Common/function/Error';
import { ConvertToUTCEndOfDay, ConvertToUTCStartOfDay, HandleDateFormatToAPI, HandleDateTimeFormatToAPI } from '../../_Common/function/Date';
import Spinner from '@/Components/Spinner';
import { FileMimeType } from '@/_Common/enum/file-type.enum';

// Register the components globally
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartData = {
    yearly: {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'Credited',
            data: [5000, 6000, 7500, 8000, 8500],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    monthly: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: 'Credited',
            data: [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    weekly: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Credited',
            data: [150, 200, 250, 300],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
    daily: {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        datasets: [{
            label: 'Credited',
            data: [50, 75, 100, 125, 150, 175, 200],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    },
};

const ChartComponent = () => {
    const chartRef = useRef(null);
    const [selectedRange, setSelectedRange] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('yearly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(1); // State variable to store current page
    const [filter, setFilter] = useState<string>('');
    const [totalItems, setTotalItems] = useState<number>(0); // State variable to store total number of items
    const [userDetailLocal, setUserDetailLocal] = useState<UserDetailsLocalStorage>();
    const [subsidyTransactions, setSubsidyTransactions] = useState<SubsidyTransactionsPagination[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [chartData, setChartData] = useState<any>(null);
    const [isOpenModalDownloadReport, setIsOpenodalDownloadReport] = useState(false);

    interface DownloadReport {
        startDate: string;
        endDate: string;
        employee_id: string;

    }

    const initial: DownloadReport = {
        startDate: new Date().toISOString().split('T')[0], // Initialize with today's date in YYYY-MM-DD format
        endDate: new Date().toISOString().split('T')[0], // Initialize with today's date in YYYY-MM-DD format
        employee_id: ''
    }

    const [initializeSubmitDownloadReportDetails, setInitializeSubmitDownloadReportDetails] = useState<DownloadReport>(initial);

    // Update chart with new data
    const updateChartData = (data: any) => {
        if (chartRef.current) {
            (chartRef as any).current.data = data;
            (chartRef as any).current.update();
        }
    };

    // Function to fetch data from API based on selected range
    const fetchChartData = async (range: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }



            setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);


            const response = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.SUBSIDY_CHART_REPORT}&range=${range}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                }
            }); // Adjust the URL to your API
            const fetchedData = response.data;

            const formattedData = {
                labels: fetchedData.labels,
                datasets: [{
                    label: 'Credited',
                    data: fetchedData.data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                }]
            };

            setChartData((prevData: any) => ({
                ...prevData,
                [range]: formattedData,
            }));
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    };

    // Handle dropdown selection for time range
    const handleRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const range = event.target.value as 'yearly' | 'monthly' | 'weekly' | 'daily';
        setSelectedRange(range);
        updateChartData(range);
    };

    // Export chart as image, CSV, or Excel
    const exportChart = (type: 'image' | 'csv' | 'excel') => {
        const chart = chartRef.current;

        switch (type) {
            case 'image':
                if (chart) {
                    const link = document.createElement('a');
                    link.href = (chart as any).toBase64Image();
                    link.download = 'chart.png';
                    link.click();
                }
                break;
            case 'csv':
                let csvContent = 'Month, Sales\n';
                chartData.monthly.labels.forEach((label: any, index: number) => {
                    csvContent += `${label},${chartData.monthly.datasets[0].data[index]}\n`;
                });

                const csvLink = document.createElement('a');
                csvLink.href = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
                csvLink.download = 'chart-data.csv';
                csvLink.click();
                break;
            case 'excel':
                const worksheet = XLSX.utils.json_to_sheet(chartData.monthly.labels.map((label: any, index: number) => ({
                    Month: label,
                    Sales: chartData.monthly.datasets[0].data[index],
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], {
                    type: FileMimeType.XLSX,
                });
                saveAs(blob, 'chart-data.xlsx');
                break;
        }
    };

    // Download selection component
    const DownloadSelection = () => {
        const handleDownload = (event: React.ChangeEvent<HTMLSelectElement>) => {
            exportChart(event.target.value as 'image' | 'csv' | 'excel');
        };

        return (
            <select id="download-select" onChange={handleDownload} style={{ backgroundColor: 'gray', color: 'black' }}>
                <option value="">Download as...</option>
                <option value="image">Image (PNG)</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
            </select>
        );
    };

    interface SubsidyTransactionsPagination {
        name: string,
        employee_id: string,
        department_name: string,
        cost_center_code: string,
        uuid: string,
        credit_used: number;
        employee_category_name: string;
        transaction_date: string;

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


            const requestBooking = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.SUBSIDY_TRANSACTION_PAGINATION}&page=${currentPage}&filter=${filter}&startDate=${startDate}&endDate=${endDate}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });

            const subsidyTransactionsArray: SubsidyTransactionsPagination[] = [];


            if (requestBooking.data?.transactions) {
                const subsidyTransactions: SubsidyTransaction[] = requestBooking.data?.transactions as SubsidyTransaction[];

                subsidyTransactions.map(item => {

                    const subsidyTransaction: SubsidyTransactionsPagination = {
                        name: String((item as any)?.user?.UserDetails?.name).toUpperCase() || '',
                        employee_id: String((item as any)?.user?.employee_id) || '',
                        department_name: (item as any)?.user?.department?.department_name || '',
                        uuid: String((item as any)?.uuid) || '',  // The parenthesis was missing here
                        credit_used: item?.credit_used || 0,  // Assuming `credit_used` is a number, and defaulting to 0 if undefined
                        cost_center_code: (item as any)?.user?.cost_center?.cost_center_code || '',
                        employee_category_name: (item as any)?.user?.employee_category?.employee_category_name || '',
                        transaction_date: `${new Date(item?.transaction_at)?.toLocaleDateString()} ${new Date(item?.transaction_at)?.toLocaleTimeString()}` || '',
                    };


                    subsidyTransactionsArray.push(subsidyTransaction);
                });


            }

            setSubsidyTransactions(subsidyTransactionsArray.length > 0 ? subsidyTransactionsArray : []);

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
        setLoading(true);
        try {
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
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }

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

        setIsOpenodalDownloadReport(true);
    }

    const HandleCloseDownloadReport = () => {
        setIsOpenodalDownloadReport(false);
    };

    const ModalDownloadReport = () => {


        const [submitDetails, setSubmitDetails] = useState<DownloadReport>(initial);
        const todayDate = new Date().toISOString().split('T')[0];


        // Handle file submission
        const HandleSubmit = async () => {
            setLoading(true);
            try {

                const pickedDate = '2024-10-01';

                // Start of the day (MYT)
                const startDateMYT = `${submitDetails.startDate}T00:00:00`;
                // End of the day (MYT)
                const endDateMYT = `${submitDetails.endDate}T23:59:59`;
                // Convert Malaysia Time (UTC+8) to UTC by subtracting 8 hours
                const startDateUTC = new Date(new Date(startDateMYT).getTime() - (8 * 60 * 60 * 1000)); // Subtract 8 hours
                const endDateUTC = new Date(new Date(endDateMYT).getTime() - (8 * 60 * 60 * 1000)); // Subtract 8 hours


                const startDateUTCString = startDateUTC.toISOString();
                const endDateUTCString = endDateUTC.toISOString();
                // Ensure the user's authorization details are valid
                const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                if (!userDetailsLocalStorage) {
                    await HandleUnAuthorized(null);
                    return;
                }

                setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);

                let employees_id: string[] = []

                if (submitDetails.employee_id) {
                    const splitEmployeeID: string[] = submitDetails.employee_id.trim().split(',');

                    employees_id = splitEmployeeID.length > 0 ? splitEmployeeID : [];

                    employees_id = employees_id.map(id => id.trim());

                }
                await SubsidyTransactionReportDownload({
                    startDate: startDateUTCString,
                    endDate: endDateUTCString,
                    employees_id,
                });
                // Request the report from the server
                const response = await axios.get(`/api/subsidy?${StatusAPICode.code}=${StatusAPICode.SUBSIDY_REPORT_DOWNLOAD}&startDate=${startDateUTCString}&endDate=${endDateUTCString}&employees_id=${JSON.stringify(employees_id)}`, {
                    headers: {
                        Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`,
                    },
                    responseType: 'blob', // Important for handling binary data
                });

                // Create a new Blob object using the response data
                const blob = new Blob([response.data], {
                    type: FileMimeType.XLSX,
                });

                // Create a link element
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'report.xlsx'; // Set the default file name for the download
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

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


        return (
            <>
                {isOpenModalDownloadReport && (
                    <div className="flex items-center justify-center h-screen">
                        {/* <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => setIsOpenodalDownloadReport(true)}
                        >
                            Download Report
                        </button> */}


                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg w-96 p-6">
                                <div className="flex justify-between items-center border-b pb-3 mb-4">
                                    <h1 className='text-black'>Download Report</h1>
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
                                                    <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start Date</label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        id="startDate"
                                                        value={submitDetails.startDate} // Display the selected date
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        onChange={handleInputChange}
                                                        max={todayDate} // Disable future dates
                                                        required
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End Date</label>
                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        id="endDate"
                                                        value={submitDetails.endDate} // Display the selected date
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        onChange={handleInputChange}
                                                        max={todayDate} // Disable future dates
                                                        required
                                                    />
                                                </div>

                                                <div className="mt-4">
                                                    <label
                                                        htmlFor="employee_id"
                                                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                    >
                                                        Employee ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="employee_id"
                                                        id="employees_id"
                                                        value={submitDetails.employee_id} // Display the selected date
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-80 p-2.5 dark:bg-white dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
            <MainContent />

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
                        <p className='text-black mb-2'><strong>Subsidy Transactions</strong></p>

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
                            <button
                                onClick={HandleOpenModalReport}
                                className="bg-blue-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Download Report

                            </button>
                        </div>

                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
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
                                            Credit Been Used (RM)
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Transaction Date
                                        </th>


                                    </tr>
                                </thead>
                                <tbody>
                                    {subsidyTransactions && subsidyTransactions.length > 0 ?
                                        subsidyTransactions.map((item, index) => (
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
                                                    {item.employee_category_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.credit_used}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.transaction_date}
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
                    <ModalDownloadReport />
                </div>
            </div>


        </>
    );
};

export default ChartComponent;
