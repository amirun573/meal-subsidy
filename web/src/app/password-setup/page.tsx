
"use client";
import React, { Suspense, useRef, useState } from 'react';
import Navbar from '@/Components/Navbar';
import { MainContent } from '@/Components/Main';
import axios from "axios";
import { encrypt } from '@/_Common/function/Hashing';
import { StatusAPICode } from '@/_Common/enum/status-api-code.enum';

const PasswordHashing = () => {


    const [password, setPassword] = useState<string>('');
    const [hashingPassword, setHashingPassword] = useState<string>('');


    const handlePassword = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const passwordTemp: string = String(event.target.value); // Ensure numeric value

            if (passwordTemp) {

                const passwordHashingRequest = await axios.get(`/api/auth/sign-in?${StatusAPICode.code}=${StatusAPICode.hashing_password}&hashingPasswordRequest=${passwordTemp}`);

                if (!passwordHashingRequest.data?.passwordHashing) {
                    throw Error("Failed to get Hashing Password");
                }

                setHashingPassword(passwordHashingRequest.data?.passwordHashing as string);
                setPassword(passwordTemp);

                return;
            }

            else {
                setHashingPassword('');
                setPassword('');
            }


        } catch (error) {
            console.error(error);
            alert(error);
        }
    }
    return (<>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'white', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', height: 'auto', position: 'relative', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <label
                        htmlFor='password'
                        style={{
                            display: 'block',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: 'black'
                        }}>
                        Password:
                    </label>
                    <input
                        type='text'
                        name='password'
                        id='password'
                        value={password}
                        style={{
                            padding: '10px',
                            width: '250px',
                            fontSize: '16px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            color: 'black'
                        }}
                        onChange={handlePassword}  // Attach the change handler

                    />

                    <div className='mt-4'>
                        <label htmlFor="hashingPassword" className=' text-black'>Hashing Password:</label>
                        {hashingPassword && (
                            <div>
                                <p id="hashingPassword" className='text-black'>{hashingPassword}</p>
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    </>)
}
export default function Page() {


    return (<>
        <Suspense fallback={'...Loading'}>
            <Navbar />
            <MainContent />
            <PasswordHashing />
        </Suspense>
    </>)
}