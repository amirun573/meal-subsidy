"use client";
import Navbar from '@/Components/Navbar';
import QrCodeScanner from '@/Components/Scan-QR';
import { Suspense, useEffect, useState } from 'react'
import { MainContent } from '@/Components/Main';

const ScanPage = () => {



    return (
        <>
            {/* <Navbar /> */}
            <MainContent />
            <div>
                <QrCodeScanner />
            </div>
        </>

    )
}

const Page = () => {

    return (<>

        <Suspense fallback={'...Loading'}>
            <ScanPage />
        </Suspense>
    </>)

}

export default Page;

