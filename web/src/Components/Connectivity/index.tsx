"use client";
import React, { useEffect, useState } from 'react';

interface ConnectivityDetectorProps {
    onStatusChange: (isOnline: boolean) => void; // Function to pass online status back to parent
}

const ConnectivityDetector: React.FC<ConnectivityDetectorProps> = ({ onStatusChange }) => {
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [serverReachable, setServerReachable] = useState<boolean>(true);
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"; // Replace with your actual server URL

    const checkServerConnection = async () => {
        try {
            const response = await fetch(SERVER_URL);
            setServerReachable(response.ok); // Check if the response is successful
        } catch (error) {
            setServerReachable(false); // Set to false if there's an error
        }
    };

    useEffect(() => {
        // Function to check online status
        const handleOnline = () => {
            console.log("You are online");
            setIsOnline(true);
            onStatusChange(true); // Pass online status to parent
            checkServerConnection(); // Check server connection when online
        };

        const handleOffline = () => {
            console.log("You are offline");
            setIsOnline(false);
            onStatusChange(false); // Pass offline status to parent
        };

        // Initial state setup
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
            onStatusChange(navigator.onLine); // Pass initial status to parent
            console.log("Initial online status:", navigator.onLine);
            if (navigator.onLine) {
                checkServerConnection(); // Check server connection if online
            }
        }

        // Check server connectivity at regular intervals
        const intervalId = setInterval(() => {
            checkServerConnection(); // Always check the server connection
        }, 10000); // Check every 10 seconds (adjust as needed)

        // Add event listeners for online and offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup event listeners and interval on component unmount
        return () => {
            clearInterval(intervalId); // Clear the interval
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [onStatusChange]);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Connectivity Status</h2>
            <p style={{ color: isOnline ? 'green' : 'red' }}>
                You are currently {isOnline ? 'online' : 'offline'}.
            </p>
            {!serverReachable && (
                <p style={{ color: 'orange' }}>
                    Cannot reach the server. Some features may be unavailable.
                </p>
            )}
            {!isOnline && ( // Show the message only when offline
                <p style={{ color: 'red' }}>
                    Some features may be unavailable without an internet connection.
                </p>
            )}
        </div>
    );
};

export const GetLocalIPs = async (): Promise<string> => {
    return new Promise((resolve) => {
        const ips = new Set<string>();
        const pc = new RTCPeerConnection();

        pc.createDataChannel(''); // Create a data channel
        pc.createOffer().then(offer => pc.setLocalDescription(offer));

        pc.onicecandidate = (event) => {
            if (!event || !event.candidate) {
                // No more candidates, resolve with the collected IPs
                resolve(ips.size > 0 ? Array.from(ips).join(', ') : '');
                return;
            }

            const ipMatch = event.candidate.candidate.match(/\d+\.\d+\.\d+\.\d+/);
            if (ipMatch) {
                ips.add(ipMatch[0] + ':3000');
            }
        };
    });
};


export default ConnectivityDetector;
