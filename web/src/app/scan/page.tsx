"use client";
import Navbar from '@/Components/Navbar';
import QrCodeScanner from '@/Components/Scan-QR';
import { Suspense, useEffect, useState } from 'react';
import { MainContent } from '@/Components/Main';

const ScanPage = () => {
    const [employeeId, setEmployeeId] = useState<string>('');
    const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [availableCredit, setAvailableCredit] = useState<number>(0); // Example available credit
    const [discount, setDiscount] = useState<number>(0); // Example discount

    // Callback function to get scan result
    const handleScanResult = (result: string) => {
        setEmployeeId(result);
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

    const calculatedFinalPrice = totalPrice - discount - availableCredit;

    useEffect(() => {
        if (employeeId) {
            console.log(`Employee ID is set: ${employeeId}`);
            // You can perform any action here when employeeId has a value.
            // For example, making an API call or updating some other state.
        }
    }, [employeeId]); // This effect will run whenever employeeId changes.

    return (
        <>
            <Navbar />
            <MainContent />
            <div>

                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <label
                        htmlFor='totalPrice'
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'white'
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
                            color: 'black'
                        }}
                        onChange={handleTotalPriceChange}  // Attach the change handler

                    />
                </div>

                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <label
                        htmlFor='employeeID'
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'white'
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
                            color: 'black'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                    <button
                        onClick={handleToggleScannerModal}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Open QR Scanner
                    </button>

                    <button
                        // onClick={handleAnotherAction}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Submit
                    </button>

                    {/* <button
                        // onClick={handleThirdAction}
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Third Button
                    </button> */}
                </div>

                {/* Table */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <table style={{
                        width: '60%',
                        margin: '0 auto',
                        borderCollapse: 'collapse',
                        color: '#fff',
                        fontSize: '16px'
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
                                    cursor: 'pointer'
                                }}
                            >
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
