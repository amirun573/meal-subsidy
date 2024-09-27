"use client";
import Navbar from '@/Components/Navbar';
import QrCodeScanner from '@/Components/Scan-QR';
import { Suspense, useEffect, useState, useRef } from 'react';
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
    const [showScannerModal, setShowScannerModal] = useState<boolean>(true);


    const totalPriceInputRef = useRef<any>(null); // Create a ref for the input

    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [availableCredit, setAvailableCredit] = useState<number>(0); // Example available credit
    const [discount, setDiscount] = useState<number>(0); // Example discount
    const [loading, setLoading] = useState(false);
    const [employeeName, setEmployeeName] = useState<string>('');
    const [calculatedFinalPrice, setCalculatedFinalPrice] = useState<number>(0);
    const [subsidyCreditUUID, setSubsidyCreditUUID] = useState<string>('');


    const isPasting = useRef(false); // Ref to track if pasting is occurring
    const lastKeyPressTime = useRef<number | null>(null); // Track the timestamp of the last key press

    // Threshold for distinguishing between card reader input and manual typing (in milliseconds)
    const cardReaderThreshold = 50;
    // Callback function to get scan result
    const handleScanResult = (result: any) => {
        handleEmployeeID(result);
        setShowScannerModal(false); // Close modal once scan is successful

        if (totalPriceInputRef.current) {
            totalPriceInputRef.current.focus(); // Move the cursor to the input
        }
    };

    const handleToggleScannerModal = () => {
        setShowScannerModal(true); // Open modal
    };

    const handleCloseModal = () => {
        setShowScannerModal(false); // Close modal manually if needed
    };

    const handleTotalPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            let rawValue = event.target.value;

            // If the current value is "0" and the user enters a new number, replace it
            if (rawValue === '0') {
                return;
            }

            // Check if the input is a valid number
            if (!/^(\d*\.?\d*)$/.test(rawValue)) {
                throw new Error("Invalid number");
            }

            // Allow empty input (if the user clears the field)
            if (rawValue === '') {
                setTotalPrice(0);
                return;
            }

            // Parse the value to a float (removes leading zeros)
            const newValue = parseFloat(rawValue);

            // Replace 0 with the new value when a number is entered
            if (newValue !== 0) {
                rawValue = newValue.toString();
            }

            // Update the state with the new value
            setTotalPrice(newValue);

            // Directly update the input field to reflect the new value
            event.target.value = rawValue;
        } catch (error: any) {
            alert(error.message); // Show specific error message
        }
    };



    const handleEmployeeID = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoading(true);
        try {
            const employeeID = String(event?.target?.value || event); // Ensure value is string

            if (employeeID) {


                await ScanEmployeeIDValidation({ employeeID });

                const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                if (!userDetailsLocalStorage) {
                    await HandleUnAuthorized(null);
                }
                // Make sure to await the API call
                const employeeIDCheckRequest = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH}&employeeID=${encrypt(employeeID)}`, {
                    headers: {
                        Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                    }
                });

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

    const HandleEmployeeIDString = async (employe_id: string) => {
        setLoading(true);
        try {
            const employeeID = employe_id; // Ensure value is string

            if (employeeID) {


                await ScanEmployeeIDValidation({ employeeID });

                const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

                if (!userDetailsLocalStorage) {
                    await HandleUnAuthorized(null);
                }
                // Make sure to await the API call
                const employeeIDCheckRequest = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH}&employeeID=${encrypt(employeeID)}`, {
                    headers: {
                        Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
                    }
                });

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

    const HandleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const currentTime = Date.now();

        if (lastKeyPressTime.current) {
            const timeDifference = currentTime - lastKeyPressTime.current;

            if (timeDifference < cardReaderThreshold) {

                const value_card: string = String((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value.trim());



                if (value_card.length >= 5) {

                    const employee_card_value = encrypt(value_card);
                    setEmployeeId(employee_card_value);
                    //For security purpose to ensure the value is not easily visible.
                    HandleEmployeeIDString(employee_card_value);

                }



                // Handle the card reader action
            } else {
                // Handle manual input (i.e., when Enter is pressed)
                if (e.key === 'Enter') {
                    handleEmployeeID(e as unknown as React.ChangeEvent<HTMLInputElement>);
                }
            }
        }

        // Update the last key press time
        lastKeyPressTime.current = currentTime;
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
                [StatusAPICode.code]: StatusAPICode.CREATE_SUBMIT_SUBSIDY_TRANSACTION_AUTH,
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

    const ModalScannerQRCode = () => {
        try {



            return (
                <>
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
                        zIndex: 9999,
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '10px',
                            position: 'relative',
                            width: '90%',
                            maxWidth: '500px',
                            textAlign: 'center',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            margin: '1rem',
                            boxSizing: 'border-box',
                        }}>
                            {/* Header with "X" close button */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1 style={{ marginBottom: '5px', color: 'black', fontSize: '1.5rem' }}>Scan QR Code</h1>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'black',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px', // Moved back to the right
                                    }}>
                                    &times;
                                </button>
                            </div>

                            {/* QR Code Scanner */}
                            <div style={{ marginTop: '2px' }}> {/* Reduced margin-top */}
                                <QrCodeScanner onScanResult={handleScanResult} />
                            </div>


                            {/* Footer with close button */}
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        backgroundColor: '#ff4d4d',
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                    }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>



                </>
            )
        } catch (error) {
            console.error(error);
        }
    }

    const HandleKeyDownTotalPriceInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        setLoading(true);
        try {

            if (e.key === 'Enter') {
                await HandleSubmitTotalPrice();
            }
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
            await HandleUnAuthorized(error);
        } finally {
            setLoading(false);
        }
    }

    const HandleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Check if pasting is happening and prevent onChange update during pasting
        if (!isPasting.current) {
            setEmployeeId(e.target.value); // Handle typing input normally
        }
    };



    const HandlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        try {
            e.preventDefault(); // Prevent the default paste behavior
            isPasting.current = true; // Set pasting flag to true


            const pastedText = (e.clipboardData || window.Clipboard).getData('text'); // Get the pasted text
            const modifiedText = pastedText.trim(); // Modify if necessary


            console.log("modifiedText==>", modifiedText);

            setEmployeeId(modifiedText); // Set the modified value to employeeId

            // Reset the pasting flag AFTER the next event loop to ensure onChange doesn't fire immediately
            setTimeout(() => {
                isPasting.current = false;
            }, 0); // Ensure the flag is reset after the paste action is fully complete
        } catch (error) {
            console.error(error);
        }
    };





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
                        type='number'
                        name='totalPrice'
                        id='totalPrice'
                        value={totalPrice > 0 ?totalPrice: '' }
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
                        step="0.01" // Allows for decimal input
                        ref={totalPriceInputRef} // Attach the ref to this input
                        onKeyDown={HandleKeyDownTotalPriceInput} // Trigger action when Enter is pressed
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
                        onChange={HandleEmployeeChange}
                        onPaste={HandlePaste}
                        onKeyDown={HandleKeyDown} // Trigger action when Enter is pressed

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
                            <div>
                                <p>Employee Name:</p>
                                <h2 style={{ fontSize: '2em' }}>{employeeName.toUpperCase()}</h2>
                            </div>
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
                    <ModalScannerQRCode />
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
