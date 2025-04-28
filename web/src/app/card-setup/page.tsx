"use client";
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Navbar from '@/Components/Navbar';
import { MainContent } from '@/Components/Main';
import { DisplayAlert } from '@/_Common/function/Error';
import { ExtractCardNumber } from '@/_Common/function/Card';
import { debounce } from 'lodash'; // or implement your own debounce

const PasswordHashing = () => {
    const [password, setPassword] = useState<string>('');
    const [hashingPassword, setHashingPassword] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const lastKeyPressTime = useRef<number | null>(null); // Track the timestamp of the last key press
    const [inputBuffer, setInputBuffer] = useState<string>('');
    const cardReaderThreshold = 50; // Threshold for differentiating card reader input from manual input (in ms)
    const inputRef = useRef<HTMLInputElement>(null);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const isPasting = useRef(false); // Ref to track if pasting is occurring
    const [finishPasting, setFinishPasting] = useState<boolean>(false);

    // Automatically focus the input field when the page loads
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const debouncedHandleCardInput = debounce((buffer: string) => {
        console.log("Debounced Handle Card Input: ", buffer);

        handleCardInput(buffer);
        setInputBuffer('');
    }, 500); // Adjust the timeout based on how fast your card reader inputs


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        console.log("handleInputChange")

        const value = e.target.value;
        setPassword(value);

        // Clear previous timeout
        if (typingTimeout) clearTimeout(typingTimeout);

        // Set a new timeout to trigger when pasting/input stops
        const timeout = setTimeout(() => {
            setHashingPassword(ExtractCardNumber(value)); // Assign after 5 seconds
            isPasting.current = false;
            setFinishPasting(true);
            // You can process the card ID here (e.g., send request)
        }, 300); // Adjust delay based on card reader speed

        setTypingTimeout(timeout);
    };
    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setPassword(e.target.value);
    // };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

        console.log("handleKeyDown")

        const currentTime = Date.now();

        if (lastKeyPressTime.current) {
            const timeDifference = currentTime - lastKeyPressTime.current;

            if (timeDifference < cardReaderThreshold) {
                // Assume card reader input
                if (e.key !== 'Enter') {
                    setInputBuffer(prevBuffer => prevBuffer + e.key);
                } else {
                    debouncedHandleCardInput(inputBuffer);
                }
            } else {
                // Clear buffer for manual input, as this seems like the start of a new entry
                setInputBuffer('');
            }
        }

        lastKeyPressTime.current = currentTime;
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {

        console.log("handlePaste")
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').trim();
        console.log(pastedText)

        setPassword(pastedText); // Set the value directly from paste
        handleCardInput(pastedText); // Handle as if it's a card reader input
    };

    const handleCardInput = (cardData: string) => {
        setLoading(true);
        try {
            if (cardData) {
                // Perform validation or processing of cardData here

                setPassword(cardData); // Update the password input field

                const decryptCard = ExtractCardNumber(cardData);

                setHashingPassword(decryptCard);

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
            setHashingPassword(() => {
                const newHashingPassword = ExtractCardNumber(password);

                // Any additional logic can be placed here
                return newHashingPassword; // Return the updated state
            });

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
                        <button
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform transform duration-300 hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            style={{ marginTop: '20px', padding: '10px 20px' }}
                            onClick={async () => {
                                const fakeCardNumber = "5E179918FEFF12E0015F86D5"; // Fake HID data
                                setPassword(''); // Clear input first
                                inputRef.current?.focus(); // focus first

                                let currentIndex = 0;

                                const interval = setInterval(() => {
                                    if (currentIndex < fakeCardNumber.length) {
                                        // Only set string values (check against undefined)
                                        const newPassword = fakeCardNumber[currentIndex] || '';
                                        setPassword((prevPassword) => String(prevPassword + newPassword)); // Ensure it's always a string
                                        currentIndex++;
                                    } else {
                                        clearInterval(interval);

                                        // After finishing typing, check and process the value
                                        setTimeout(() => {
                                            const processedPassword = ExtractCardNumber(fakeCardNumber); // Extract card number
                                            if (processedPassword) {
                                                setPassword(processedPassword); // Only set password if valid string
                                            }
                                            setFinishPasting(true);
                                        }, 100); // small delay after typing
                                    }
                                }, 50); // Speed of each character input (like HID speed)
                            }}
                        >
                            Simulate Card Tap
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
