import React, { useState, useEffect } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

const QrCodeScanner = () => {
    const [scanResult, setScanResult] = useState<string>('');
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length > 0) {
            setScanResult(detectedCodes[0].rawValue || '');
        }
    };

    const handleError = (error: unknown) => {
        if (error instanceof Error) {
            console.error('Error:', error.message);
            setErrorMessage('An error occurred while accessing the camera.');
        } else {
            console.error('Unknown error:', error);
            setErrorMessage('An unknown error occurred.');
        }
    };

    const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCamera(event.target.value);
    };

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Request permission to access the camera
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(() => {
                    // Enumerate devices after getting permission
                    return navigator.mediaDevices.enumerateDevices();
                })
                .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    setCameras(videoDevices);
                    if (videoDevices.length > 0) {
                        setSelectedCamera(videoDevices[0].deviceId);
                    }
                })
                .catch(error => {
                    console.error('Error accessing media devices:', error);
                    setErrorMessage('Failed to access your camera. Please check your browser settings.');
                });
        } else {
            setErrorMessage('Your browser does not support camera access. Please use a modern browser.');
        }
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '0 20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '600px',
                boxSizing: 'border-box',
            }}>
                <h1 style={{ textAlign: 'center' }}>Scanner Employee QR Here</h1>
                {errorMessage ? (
                    <p style={{ textAlign: 'center', color: 'red' }}>{errorMessage}</p>
                ) : (
                    <>
                        {cameras.length > 1 && (
                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <label htmlFor="cameraSelect">Choose Camera: </label>
                                <select id="cameraSelect" onChange={handleCameraChange} value={selectedCamera}>
                                    {cameras.map(camera => (
                                        <option key={camera.deviceId} value={camera.deviceId}>
                                            {camera.label || `Camera ${camera.deviceId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Scanner
                            onScan={handleScan}
                            onError={handleError}
                            constraints={{
                                facingMode: { exact: selectedCamera ? undefined : 'environment' },
                                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                            }}
                        />
                        {scanResult && <p style={{ textAlign: 'center' }}>Employee ID: {scanResult}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default QrCodeScanner;
