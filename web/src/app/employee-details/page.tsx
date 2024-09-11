"use client";
import Navbar from "@/Components/Navbar";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { GetLocalStorageDetails, HandleUnAuthorized } from "@/_Common/function/LocalStorage";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import axios from "axios";
import { Suspense, useState } from "react";


const EmployeeDetails = () => {

    const [currentPage, setCurrentPage] = useState<number>(1); // State variable to store current page
    const [totalItems, setTotalItems] = useState<number>(0); // State variable to store total number of items
    const [userDetailLocal, setUserDetailLocal] = useState<UserDetailsLocalStorage>();

    const GetBooking = async () => {
        try {

            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }

            setUserDetailLocal(userDetailsLocalStorage as UserDetailsLocalStorage);
            const requestBooking = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_EMPLOYEE_DETAILS}&page=${currentPage}&filter={}`, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage?.accessToken}`
                }
            });
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
        GetBooking();
    };


    return (<>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                <div>
                    <h1 className="text-black">Employee Details</h1>


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
                                        <th scope="col" className="px-6 py-3">Edit</th>

                                    </tr>
                                </thead>
                                {/* <tbody>
                                    {booking && booking.length > 0 ?
                                        booking.map((item, index) => (
                                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {index + 1}
                                                </th>
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                    {item?.uuid}
                                                </th>
                                                <td className="px-6 py-4">
                                                    {(item as any)?.store_service?.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(item as any)?.event?.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item?.booking_status.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-6 py-4">{
                                                    handleAPIDateFormatToClient({
                                                        date: new Date((item as any)?.event?.start_time),
                                                        timeFormatHour: true

                                                    })

                                                }</td>
                                                <td className="px-6 py-4">
                                                    {
                                                        handleAPIDateFormatToClient({
                                                            date: new Date((item as any)?.event?.end_time),
                                                            timeFormatHour: true

                                                        })

                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                                        onClick={() => handleUpdateBooking(item?.uuid as string || '')}
                                                    >
                                                        Edit
                                                    </button>
                                                </td>


                                            </tr>
                                        )) : <tr></tr>}
                                </tbody> */}

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
        </div>
    </>);
}


const Page = () => {
    return (
        <Suspense fallback={'...Loading'}>
            <Navbar />
            <EmployeeDetails />
        </Suspense>
    );
};

export default Page;