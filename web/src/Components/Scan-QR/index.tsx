import React, { useState, useEffect } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

const QrCodeScanner = () => {
    const [scanResult, setScanResult] = useState<string>('');
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length > 0) {
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

    const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCamera(event.target.value);
    };

    useEffect(() => {
        // Get available video input devices (cameras)
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                console.log("videoDevices==>", videoDevices);
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedCamera(videoDevices[0].deviceId);
                }
            })
            .catch(error => {
                console.error('Error getting video devices:', error);
            });
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
            </div>
        </div>
    );
};

export default QrCodeScanner;
