import React, { useState } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

const QrCodeScanner = () => {
    const [scanResult, setScanResult] = useState<string>('');

    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
        console.log("detectedCodes==>", detectedCodes);
        if (detectedCodes.length > 0) {
            // Process the first detected code
            setScanResult(detectedCodes[0].rawValue || '');
        }
    };

    const handleError = (error: unknown) => {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '70vh',
            padding: '0 20px',
        }}>
            <div style={{
                width: '100%', // Adjust to occupy full width
                height: 'auto',
                maxWidth: '800px', // Set a larger maximum width
                aspectRatio: '1.5', // Maintain aspect ratio for the scanner
                boxSizing: 'border-box',
                position: 'relative', // Required to position video properly
            }}>
                <h1 style={{ textAlign: 'center' }}>Scanner Employee QR Here</h1>

                {/* Wrapper div to control the size of the scanner */}
                <div style={{ width: '100%', height: '100%' }}>
                    <Scanner
                        onScan={handleScan}
                        onError={handleError}
                        constraints={{
                            facingMode: 'environment', // Use the back camera
                            width: { ideal: 1280 },    // Set ideal width for the video stream
                            height: { ideal: 720 },    // Set ideal height for the video stream
                        }}
                    />
                </div>

                {scanResult && <p style={{ textAlign: 'center' }}>Employee ID: {scanResult}</p>}
            </div>
        </div>
    );
};

export default QrCodeScanner;
