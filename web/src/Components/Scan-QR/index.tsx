import React, { useState, useCallback } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import _ from 'lodash'; // Import lodash to use the throttle function

const QrCodeScanner = () => {
    const [scanResult, setScanResult] = useState<string>('');

    // Throttle scan handling to avoid processing too often
    const handleScan = useCallback(_.throttle((detectedCodes: IDetectedBarcode[]) => {
        console.log("detectedCodes==>", detectedCodes);
        if (detectedCodes.length > 0) {
            setScanResult(detectedCodes[0].rawValue || '');
        }
    }, 500), []);  // Adjust the delay in ms (500ms in this case)

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
                width: '100%',
                height: 'auto',
                maxWidth: '800px',
                aspectRatio: '1.5',
                boxSizing: 'border-box',
                position: 'relative',
            }}>
                <h1 style={{ textAlign: 'center' }}>Scanner Employee QR Here</h1>

                <div style={{ width: '100%', height: '100%' }}>
                    <Scanner
                        onScan={handleScan}
                        onError={handleError}
                        constraints={{
                            facingMode: 'environment',
                            width: { ideal: 3000 },
                            height: { ideal: 1280 },
                        }}
                    />
                </div>

                {scanResult && <p style={{ textAlign: 'center' }}>Employee ID: {scanResult}</p>}
            </div>
        </div>
    );
};

export default QrCodeScanner;
