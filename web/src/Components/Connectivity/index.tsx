"use client";
import React, { useEffect, useState } from 'react';

interface ConnectivityDetectorProps {
    onStatusChange: (isOnline: boolean) => void; // Function to pass online status back to parent
}

const ConnectivityDetector: React.FC<ConnectivityDetectorProps> = ({ onStatusChange }) => {
    const [isOnline, setIsOnline] = useState<boolean>(false);

    useEffect(() => {
        // Check online status only on the client side
        const handleOnline = () => {
            console.log("You are online");
            setIsOnline(true);
            onStatusChange(true); // Pass online status to parent
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
        }

        // Add event listeners for online and offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup event listeners on component unmount
        return () => {
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
                ips.add(ipMatch[0] + ':3001');
            }
        };
    });
};


export default ConnectivityDetector;
