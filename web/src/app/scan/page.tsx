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
import { GetLocalIPs, ConnectivityDetector, InternetDetector } from '../../Components/Connectivity/index';
import { useServiceWorker } from '@/_Common/function/ServiceWorker';
import React from 'react';
import { useSocket } from '@/_Common/function/Socket';
import { debounce } from 'lodash';
import { ExtractCardNumber } from '@/_Common/function/Card';
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
    const [isOnline, setIsOnline] = useState<boolean>(true); // Initialize the online status

    const [internet, setInternet] = useState<boolean>(true);

    const isPasting = useRef(false); // Ref to track if pasting is occurring
    const lastKeyPressTime = useRef<number | null>(null); // Track the timestamp of the last key press

    const [finishPasting, setFinishPasting] = useState<boolean>(false);
    const [pastedValue, setPastedValue] = useState<string | null>(null);

    const { sendMessage } = useSocket();

    // Threshold for distinguishing between card reader input and manual typing (in milliseconds)
    const cardReaderThreshold = 50;
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputBuffer, setInputBuffer] = useState<string>('');

    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const waitingForEnter = useRef<boolean>(false);

    // Automatically focus the input field when the page loads
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (inputBuffer || typeof(inputBuffer) === 'string') {
            setEmployeeId(inputBuffer); // Ensure `employeeId` updates when `inputBuffer` changes
        }
    }, [inputBuffer]);

    const debouncedHandleCardInput = debounce((buffer: string) => {
        handleCardInput(buffer);
        setInputBuffer('');
    }, 500); // Adjust the timeout based on how fast your card reader inputs

    const handleCardInput = (cardData: string) => {
        setLoading(true);
        try {
            if (cardData) {
                // Perform validation or processing of cardData here


                const decryptCard = ExtractCardNumber(cardData);

                setEmployeeId(decryptCard); // Update the password input field
                setFinishPasting(true);

            }
        } catch (error) {
            console.error("Error processing card input:", error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    };
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

                if (!userDetailsLocalStorage?.accessToken) {
                    throw Error("Access Token Not Exist. Please Login");
                }

                if (internet) {
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
                }

                else {
                    const data: any = await sendMessage(encrypt(JSON.stringify({
                        employeeID: encrypt(employeeID),
                        accessToken: userDetailsLocalStorage.accessToken,
                        code: StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH
                    })));

                    if (!data) {
                        throw ("No Data Been Retrieved")
                    }


                    setEmployeeId(data?.employee_id as string);


                    setSubsidyCreditUUID(data?.subsidyCreditUUID as string);
                    const newAvailableCredit: number = data?.available_credit as number > 0 ? data?.available_credit as number : 0;

                    setEmployeeName(data?.employee_name);
                    setAvailableCredit(newAvailableCredit)

                    const newDiscount: number = newAvailableCredit > 0 ? newAvailableCredit - totalPrice : 0;

                    setDiscount(newDiscount);

                }

                // Process employeeIDCheckRequest response as necessary
            } else {
                setEmployeeId('');
            }

        } catch (error) {
            DisplayAlert(error); // Make sure this doesn't block code execution
        } finally {
            // This should always execute regardless of error
            setLoading(false);
        }
    };

    // const HandleEmployeeIDString = async (employe_id: string) => {
    //     setLoading(true);
    //     try {
    //         const employeeID = employe_id; // Ensure value is string

    //         if (employeeID) {


    //             await ScanEmployeeIDValidation({ employeeID });

    //             const userDetailsLocalStorage = await GetLocalStorageDetails() as UserDetailsLocalStorage;

    //             if (!userDetailsLocalStorage) {
    //                 await HandleUnAuthorized(null);
    //             }
    //             // Make sure to await the API call
    //             const employeeIDCheckRequest = await axios.get(`/api/user?${StatusAPICode.code}=${StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH}&employeeID=${encrypt(employeeID)}`, {
    //                 headers: {
    //                     Authorization: `Bearer ${userDetailsLocalStorage.accessToken}`
    //                 }
    //             });

    //             if (!employeeIDCheckRequest.data?.employee_id || !employeeIDCheckRequest.data?.employee_name || (typeof employeeIDCheckRequest.data?.available_credit !== 'number') || !employeeIDCheckRequest.data?.subsidyCreditUUID) {
    //                 throw Error("Failed To Retrieve Subsidy Details");
    //             }

    //             setEmployeeId(employeeIDCheckRequest.data?.employee_id as string);


    //             setSubsidyCreditUUID(employeeIDCheckRequest.data?.subsidyCreditUUID as string);
    //             const newAvailableCredit: number = employeeIDCheckRequest.data?.available_credit as number > 0 ? employeeIDCheckRequest.data?.available_credit as number : 0;

    //             setEmployeeName(employeeIDCheckRequest.data?.employee_name);
    //             setAvailableCredit(newAvailableCredit)

    //             const newDiscount: number = newAvailableCredit > 0 ? newAvailableCredit - totalPrice : 0;

    //             setDiscount(newDiscount);
    //             // Process employeeIDCheckRequest response as necessary
    //         } else {
    //             setEmployeeId('');
    //         }

    //     } catch (error) {
    //         console.error("Error occurred:", error);
    //         DisplayAlert(error); // Make sure this doesn't block code execution
    //     } finally {
    //         // This should always execute regardless of error
    //         setLoading(false);
    //     }
    // };

    // const HandleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    //     const currentTime = Date.now();

    //     if (lastKeyPressTime.current) {
    //         const timeDifference = currentTime - lastKeyPressTime.current;

    //         if (timeDifference < cardReaderThreshold) {
    //             // Detected fast input from a card reader
    //             const value_card = e.currentTarget.value.trim();
    //             setEmployeeId(value_card);
    //             console.log("Card Reader Input:", value_card);
    //         } else {
    //             // Handle manual input (e.g., Enter key)
    //             if (e.key === 'Enter') {
    //                 handleEmployeeID(e as unknown as React.ChangeEvent<HTMLInputElement>);
    //             }
    //         }
    //     }

    //     lastKeyPressTime.current = currentTime;
    // };








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

            if (internet) {
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
            }

            else {
                const requestBody: any = await sendMessage(encrypt(JSON.stringify({
                    ...data,
                    [StatusAPICode.code]: StatusAPICode.CREATE_SUBMIT_SUBSIDY_TRANSACTION_AUTH,
                    accessToken: userDetailsLocalStorage.accessToken,
                })));

                if (!requestBody) {
                    throw ("No Data Been Retrieved")
                }
                if (!requestBody?.updateSubsidy) {
                    throw Error("Cannot Retreive Data For Update Subisdy Credit");
                }

                alert("Successfully Update");

                window.location.reload();
            }



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

    // const HandleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!isPasting.current) {
    //         console.log("Manual input detected:", e.target.value);
    //         setEmployeeId(e.target.value);
    //         // Cancel paste delay if user types manually
    //         setPastedValue(null);
    //     } else {
    //         console.log("Pasting detected but ignored onChange.");
    //         setFinishPasting(true);
    //     }
    // };



    const HandlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        try {
            console.log("HandlePaste-->")

            e.preventDefault(); // Prevent default paste behavior
            isPasting.current = true;

            const pastedText = e.clipboardData.getData("text").trim();
            setPastedValue(pastedText); // Store in temporary state


            // Delay assignment for 5 seconds
            setTimeout(() => {
                setEmployeeId(ExtractCardNumber(pastedText)); // Assign after 5 seconds
                isPasting.current = false;
                setFinishPasting(true);
            }, 5); // 5-second delay

        } catch (error) {
            console.error("HandlePaste==>",error);
        }
    };

    //This function is using for HID Card reader
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (waitingForEnter.current || isPasting.current) return; // ❌ Ignore manual typing (handled in handleKeyDown)


            console.log("handleInputChange-->")
            const value = e.target.value;
            setEmployeeId(value);
    
            // Clear previous timeout
            if (typingTimeout) clearTimeout(typingTimeout);
    
            // Set a new timeout to trigger when pasting/input stops
            const timeout = setTimeout(() => {
                setEmployeeId(ExtractCardNumber(value)); // Process pasted input
                isPasting.current = false;
                setFinishPasting(true);
            }, 800);
    
            setTypingTimeout(timeout);
        } catch (error) {
            console.error("handleInputChange==>",error);
        }
       
    };


    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        const currentTime = Date.now();
        const timeDifference = lastKeyPressTime.current ? currentTime - lastKeyPressTime.current : null;
        lastKeyPressTime.current = currentTime;

        if (timeDifference !== null && timeDifference < 100) {
            // Card Reader Input (debounced)
            if (e.key === 'Enter') {
                e.preventDefault();
                setEmployeeId(inputBuffer);
                debouncedHandleCardInput(inputBuffer);
                setInputBuffer(""); // Clear buffer after processing
            } else if (e.key === "Backspace") {
                setInputBuffer((prevBuffer) => (prevBuffer.length > 1 ? prevBuffer.slice(0, -1) : ""));
            } else {
                setInputBuffer((prevBuffer) => prevBuffer + e.key);
            }
        } else {
            // Manual Input Mode
            if (!waitingForEnter.current) {
                waitingForEnter.current = true; // Start tracking manual typing
                setInputBuffer(""); // Reset buffer when user starts typing
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                handleEmployeeID(inputBuffer as any);
                setInputBuffer(""); // Clear buffer after processing
                waitingForEnter.current = false; // Reset after processing
            } else if (e.key === "Backspace") {
                setInputBuffer((prevBuffer) => (prevBuffer.length <= 1 ? "" : prevBuffer.slice(0, -1)));
            } else if (e.key.length === 1) { // Prevent non-character keys from affecting input
                setInputBuffer((prevBuffer) => prevBuffer + e.key);
            }
        }
    };






    const handleInternetStatusChange = (status: boolean) => {
        setInternet(status); // Update the online status
        // You can also perform other actions here based on the status change
    };

    const handleStatusChange = (status: boolean) => {
        setIsOnline(status); // Update the online status
        // You can also perform other actions here based on the status change
    };

    const fetchLocalIP = async () => {
        const localIPs = await GetLocalIPs();
    };


    useEffect(() => {

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(function (registration) {
                    return navigator.serviceWorker.ready;
                })
                .then(function (registration) {
                })
                .catch(function (error) {
                });
        }
    }, []); // Empty array ensures this runs only on component mount



    const { registerServiceWorker } = useServiceWorker();


    useEffect(() => {
        if (!isOnline) {
            fetchLocalIP();
        }
    }, [isOnline])





    useEffect(() => {
        const finalPrice: number = Math.max(0, totalPrice - availableCredit);

        setCalculatedFinalPrice(finalPrice);

    }, [totalPrice, availableCredit, discount]);

    // Handle pasting completion safely
    useEffect(() => {
        if (finishPasting) {
            handleEmployeeID(employeeId as any);
            setFinishPasting(false);
        }
    }, [finishPasting]);
    return (
        <>
            <Navbar />
            <MainContent />
            <InternetDetector onInternetStatusChange={handleInternetStatusChange} />

            <ConnectivityDetector onStatusChange={handleStatusChange} />

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
                        value={totalPrice > 0 ? totalPrice : ''}
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
                        ref={inputRef}

                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={HandlePaste}

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
