"use client";
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Navbar from '@/Components/Navbar';
import { MainContent } from '@/Components/Main';
import { DisplayAlert } from '@/_Common/function/Error';
import { ConvertToFiveDigits } from '@/_Common/function/Card';
const PasswordHashing = () => {
    const [password, setPassword] = useState<string>('');
    const [hashingPassword, setHashingPassword] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const lastKeyPressTime = useRef<number | null>(null); // Track the timestamp of the last key press
    const inputBuffer = useRef<string>(''); // Buffer to accumulate card reader input
    const cardReaderThreshold = 50; // Threshold for differentiating card reader input from manual input (in ms)
    const inputRef = useRef<HTMLInputElement>(null);

    // Automatically focus the input field when the page loads
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {


        const currentTime = Date.now();

        if (lastKeyPressTime.current) {
            const timeDifference = currentTime - lastKeyPressTime.current;

            if (timeDifference < cardReaderThreshold) {
                // Assume card reader input
                if (e.key !== 'Enter') {
                    inputBuffer.current += e.key; // Accumulate the keypress
                }

                else {
                    handleCardInput(inputBuffer.current);

                }

                console.log('Card Reader Input:', inputBuffer.current)
            } else if (e.key === 'Enter') {
                // Handle manual input submission
                console.log('Manual Submission:', inputBuffer.current)

                handleCardInput(inputBuffer.current);
                inputBuffer.current = ''; // Clear buffer after processing
            }
        } else {
            // Start tracking input time
            if (e.key !== 'Enter') {
                inputBuffer.current = e.key;
            }
        }

        lastKeyPressTime.current = currentTime; // Update the last keypress time
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {

        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').trim();
        setPassword(pastedText); // Set the value directly from paste
        handleCardInput(pastedText); // Handle as if it's a card reader input
    };

    const handleCardInput = (cardData: string) => {
        setLoading(true);
        try {
            if (cardData) {
                // Perform validation or processing of cardData here
                console.log('Card Data:', cardData);

                setPassword(cardData); // Update the password input field

                setHashingPassword(ConvertToFiveDigits(cardData));

            }
        } catch (error) {
            console.error("Error processing card input:", error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = () => {

        if (password) {
            setHashingPassword(ConvertToFiveDigits(password));

        }

        else {
            alert("There is no value to convert. Please enter a value.");
        }

    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'white',
                padding: '20px',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '1200px',
                    height: 'auto',
                    position: 'relative',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                    <label
                        htmlFor="password"
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'black',
                        }}
                    >
                        Card Reader Input:
                    </label>
                    <div className="space-y-4 sm:space-y-0 sm:space-x-4">
                        <input
                            ref={inputRef}
                            type="text"
                            name="password"
                            id="password"
                            value={password}
                            style={{
                                padding: '10px',
                                width: '250px',
                                fontSize: '16px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                color: 'black',
                            }}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                        />
                        <button
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform transform duration-300 hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            onClick={handleConvert}
                        >
                            Convert
                        </button>
                    </div>



                    <div className="mt-4">
                        <label htmlFor="hashingPassword" className="text-black">
                            5 Digit Value:
                        </label>
                        {hashingPassword && (
                            <div>
                                <p id="hashingPassword" className="text-black">
                                    {hashingPassword}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Page() {
    return (
        <>
            <Suspense fallback="...Loading">
                <Navbar />
                <MainContent />
                <PasswordHashing />
            </Suspense>
        </>
    );
}
