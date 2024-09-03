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
            height: '100vh',
            padding: '0 20px', // Add some padding to prevent the content from touching the edges on small screens
        }}>
            <div style={{
                width: '100%',
                maxWidth: '600px', // Maximum width for larger screens
                boxSizing: 'border-box', // Ensure padding and border are included in the element's total width and height
            }}>
                <h1 style={{ textAlign: 'center' }}>Scanner Employee QR Here</h1>
                <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{ facingMode: 'environment' }}
                />
                {scanResult && <p style={{ textAlign: 'center' }}>Employee ID: {scanResult}</p>}
            </div>
        </div>
    );
};

export default QrCodeScanner;
