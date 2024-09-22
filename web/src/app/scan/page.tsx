"use client";
import Navbar from '@/Components/Navbar';
import QrCodeScanner from '@/Components/Scan-QR';
import { Suspense, useEffect, useState } from 'react';
import { MainContent } from '@/Components/Main';
import Spinner from '../../Components/Spinner/';
import axios from 'axios';
import { StatusAPICode } from '@/_Common/enum/status-api-code.enum';
import { DisplayAlert } from '@/_Common/function/Error';
import { ScanEmployeeIDValidation } from '@/_Common/validation/user.validation';
import { encrypt } from '@/_Common/function/Hashing';
import { SubsidySubmitPrice } from '@/_Common/interface/subsidy.interface';
import { EmployeeSubmitPriceValidation } from '@/_Common/validation/subsidy.validation';
import { GetLocalStorageDetails, HandleUnAuthorized } from '@/_Common/function/LocalStorage';
import { UserDetailsLocalStorage } from '@/_Common/interface/auth.interface';
import Image from 'next/image';
const ScanPage = () => {
    const [employeeId, setEmployeeId] = useState<string>('');
    const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [availableCredit, setAvailableCredit] = useState<number>(0); // Example available credit
    const [discount, setDiscount] = useState<number>(0); // Example discount
    const [loading, setLoading] = useState(false);
    const [employeeName, setEmployeeName] = useState<string>('');
    const [calculatedFinalPrice, setCalculatedFinalPrice] = useState<number>(0);
    const [subsidyCreditUUID, setSubsidyCreditUUID] = useState<string>('');

    // Callback function to get scan result
    const handleScanResult = (result: any) => {
        handleEmployeeID(result);
        setShowScannerModal(false); // Close modal once scan is successful
    };

    const handleToggleScannerModal = () => {
        setShowScannerModal(true); // Open modal
    };

    const handleCloseModal = () => {
        setShowScannerModal(false); // Close modal manually if needed
    };

    const handleTotalPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const newValue = parseFloat(event.target.value) || 0; // Ensure numeric value

            if (newValue < 0) {
                throw Error("Total Price Cannot Be Less Than 0");
            }
            setTotalPrice(newValue);
        } catch (error) {
            alert(error);
        }
    };

    const handleEmployeeID = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoading(true);
        try {
            const employeeID = String(event?.target?.value || event); // Ensure value is string

            if (employeeID) {


                await ScanEmployeeIDValidation({ employeeID });
                // Make sure to await the API call
                const employeeIDCheckRequest = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_CHECK_EMPLOYEE_ID}&employeeID=${encrypt(employeeID)}`);

                if (!employeeIDCheckRequest.data?.employee_id || !employeeIDCheckRequest.data?.employee_name || (typeof employeeIDCheckRequest.data?.available_credit !== 'number') || !employeeIDCheckRequest.data?.subsidyCreditUUID) {
                    throw Error("Failed To Retrieve Subsidy Details");
                }

                setEmployeeId(employeeIDCheckRequest.data?.employee_id as string);


                setSubsidyCreditUUID(employeeIDCheckRequest.data?.subsidyCreditUUID as string);
                const newAvailableCredit: number = employeeIDCheckRequest.data?.available_credit as number > 0 ? employeeIDCheckRequest.data?.available_credit as number : 0;

                setEmployeeName(employeeIDCheckRequest.data?.employee_name);
                setAvailableCredit(newAvailableCredit)

                const newDiscount: number = newAvailableCredit > 0 ? newAvailableCredit - totalPrice : 0;

                setDiscount(newDiscount);
                // Process employeeIDCheckRequest response as necessary
            } else {
                setEmployeeId('');
            }

        } catch (error) {
            console.error("Error occurred:", error);
            DisplayAlert(error); // Make sure this doesn't block code execution
        } finally {
            // This should always execute regardless of error
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleEmployeeID(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const HandleSubmitTotalPrice = async () => {
        setLoading(true);
        try {


            const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

            if (!userDetailsLocalStorage) {
                await HandleUnAuthorized(null);
            }
            const data: SubsidySubmitPrice = {
                totalPrice: calculatedFinalPrice,
                price: totalPrice,
                availableCredit,
                discount,
                employee_id: employeeId,
                [StatusAPICode.code]: StatusAPICode.CREATE_SUBSIDY_TRANSACTION,
                subsidyCreditUUID,
            };

            const encryptedData = {
                encryptedData: encrypt(JSON.stringify(data)),
                [StatusAPICode.code]: StatusAPICode.CREATE_SUBMIT_SUBSIDY_TRANSACTION_AUTH
            }


            await EmployeeSubmitPriceValidation(data);

            const requestSubmitPrice = await axios.post(`/api/subsidy`, encryptedData, {
                headers: {
                    Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                }
            });

            if (!requestSubmitPrice.data?.updateSubsidy) {
                throw Error("Cannot Retreive Data For Update Subisdy Credit");
            }

            alert("Successfully Update");

            window.location.reload();

        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        const finalPrice: number = Math.max(0, totalPrice - availableCredit);

        setCalculatedFinalPrice(finalPrice);

    }, [totalPrice, availableCredit, discount]);


    return (
        <>
            <Navbar />
            <MainContent />
            <div>
                {loading && <Spinner />}

                <div style={{ margin: '20px 10px', display: 'flex', justifyContent: 'center' }}>
                    <Image
                        src={"/img/Watlow_Logo_color rev.png"}
                        width={300} // Adjusted width
                        height={300} // Adjusted height
                        alt="Watlow Logo"
                    />
                </div>

                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                    <label
                        htmlFor='totalPrice'
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'white',
                        }}>
                        Total Price (RM):
                    </label>
                    <input
                        type='text'
                        name='totalPrice'
                        id='totalPrice'
                        value={totalPrice}
                        style={{
                            padding: '10px',
                            width: '250px',
                            fontSize: '16px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            color: 'black',
                            display: 'block',
                            margin: '0 auto', // Center the input
                        }}
                        onChange={handleTotalPriceChange} // Attach the change handler
                    />
                </div>


                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                    <label
                        htmlFor='employeeID'
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'white',
                        }}>
                        Employee ID:
                    </label>
                    <input
                        type='text'
                        name='employeeID'
                        id='employeeID'
                        value={employeeId}
                        style={{
                            padding: '10px',
                            width: '250px',
                            fontSize: '16px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            color: 'black',
                            display: 'block',
                            margin: '0 auto', // Center the input
                        }}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        onKeyDown={handleKeyDown} // Trigger action when Enter is pressed
                    />
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    {employeeName && (
                        <div style={{
                            display: 'inline-block',
                            padding: '10px',
                            borderRadius: '5px',
                            backgroundColor: '#444',
                            color: 'white',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                        }}>
                            <p>Employee Name: <h2 style={{ fontSize: '2em' }}>{employeeName.toUpperCase()}</h2></p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                        onClick={handleToggleScannerModal}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginRight: '10px', // Adjust margin between buttons
                        }}>
                        Open QR Scanner
                    </button>

                    <button
                        onClick={HandleSubmitTotalPrice}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}>
                        Submit
                    </button>
                </div>

                {/* Table */}
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        color: '#fff',
                        fontSize: '16px',
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#333' }}>
                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Description</th>
                                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Amount (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ backgroundColor: '#444' }}>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>Price</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{totalPrice.toFixed(2)}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#555' }}>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>Available Credit</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{availableCredit.toFixed(2)}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#444' }}>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>Discount</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>{discount.toFixed(2)}</td>
                            </tr>
                            <tr style={{ backgroundColor: '#555' }}>
                                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>Total</td>
                                <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{calculatedFinalPrice.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showScannerModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            position: 'relative',
                            width: '80%',
                            maxWidth: '500px',
                            textAlign: 'center',
                        }}>
                            <h2 style={{ marginBottom: '20px' }}>Scan QR Code</h2>
                            <QrCodeScanner onScanResult={handleScanResult} />

                            <button
                                onClick={handleCloseModal}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    backgroundColor: '#ff4d4d',
                                    border: 'none',
                                    color: 'white',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </>
    );
};

const Page = () => {
    return (
        <Suspense fallback={'...Loading'}>
            <ScanPage />
        </Suspense>
    );
};

export default Page;
