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
import { SubsidyTransactionPagination } from '@/_Common/validation/subsidy.validation';
import axios from 'axios';
import { StatusAPICode } from '@/_Common/enum/status-api-code.enum';
import { Subsidy, SubsidyTransaction, User } from '@prisma/client';
import { DisplayAlert } from '@/_Common/function/Error';

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
    const [selectedRange, setSelectedRange] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('monthly');

    // Update chart data based on selected range
    const updateChartData = (range: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
        const updatedData = chartData[range];
        if (chartRef.current) {
            (chartRef as any).current.data = updatedData;
            (chartRef as any).current.update();
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
                chartData.monthly.labels.forEach((label, index) => {
                    csvContent += `${label},${chartData.monthly.datasets[0].data[index]}\n`;
                });

                const csvLink = document.createElement('a');
                csvLink.href = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
                csvLink.download = 'chart-data.csv';
                csvLink.click();
                break;
            case 'excel':
                const worksheet = XLSX.utils.json_to_sheet(chartData.monthly.labels.map((label, index) => ({
                    Month: label,
                    Sales: chartData.monthly.datasets[0].data[index],
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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

    const [currentPage, setCurrentPage] = useState<number>(1); // State variable to store current page
    const [filter, setFilter] = useState<string>('');
    const [totalItems, setTotalItems] = useState<number>(0); // State variable to store total number of items
    const [userDetailLocal, setUserDetailLocal] = useState<UserDetailsLocalStorage>();
    const [subsidyTransactions, setSubsidyTransactions] = useState<SubsidyTransactionsPagination[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');


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

            await SubsidyTransactionPagination({
                page: currentPage,
                filter,
                startDate,
                endDate
            });

            setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);
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

            if (filter) {
                fetchData();
            }
        } catch (error) {
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    }, [filter])
    return (
        <>
            <Navbar />
            <MainContent />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                    {/* Dropdown Menu */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <select onChange={handleRangeChange} style={{ padding: '10px', backgroundColor: 'gray', color: 'black', border: 'none', borderRadius: '5px' }}>
                            <option value="yearly">Yearly</option>
                            <option value="monthly" selected>Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                        </select>
                        {/* Uncomment if you want to include the DownloadSelection */}
                        {/* <DownloadSelection /> */}
                    </div>

                    {/* Bar Chart */}
                    <div style={{ width: '100%', height: 'auto', flexGrow: '1', position: 'relative', aspectRatio: '2 / 1' }}>
                        <Bar ref={chartRef} data={chartData.monthly} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>

                    {/* Table */}
                    <div className="mt-10">
                        <p className='text-black mb-2'><strong>Transactions</strong></p>

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
                                            Cost Center
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
            </div>


        </>
    );
};

export default ChartComponent;
