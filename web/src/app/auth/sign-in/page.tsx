"use client";
import { Suspense, useState } from "react";
import Image from "next/image";
import Navbar from "@/Components/Navbar";
import { DisplayAlert } from "@/_Common/function/Error";
import { SignInFunctionValidation } from "@/_Common/validation/auth.validation";
import axios from "axios";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { decrypt } from "@/_Common/function/Hashing";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import { SetUserDetailsLocalStoage } from "@/_Common/function/LocalStorage";
function Login() {


    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [userDetails, setUserDetails] = useState<UserDetailsLocalStorage>();
    const [loading, setLoading] = useState<boolean>(false);

    const HandleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {

            const emailTemp = String(event.target.value);

            if (emailTemp) {

                setEmail(emailTemp);
            }

            else {
                setEmail('');
            }
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        }
    }

    const HandlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {

            const passwordTemp = String(event.target.value);

            if (passwordTemp) {

                setPassword(passwordTemp);
            }

            else {
                setPassword('');
            }
        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        }
    }

    const HandleSignInSubmit = async () => {
        setLoading(true);
        try {

            await SignInFunctionValidation({ email, password });

            const SignInRequest = await axios.post(`/api/auth/sign-in`, {
                email,
                password,
                code: StatusAPICode.sign_in_request
            });

            if (!SignInRequest.data?.userDetails) {
                throw Error("Data Not Received");
            }

            setUserDetails(SignInRequest.data?.userDetails as UserDetailsLocalStorage);

            const saveUserDetails = await SetUserDetailsLocalStoage(SignInRequest.data?.userDetails as UserDetailsLocalStorage);


            if (!saveUserDetails) {
                throw Error("Failed To Saved In Client Side");
            }

            window.location.href = '/';

            return;


        } catch (error) {
            console.error(error);
            DisplayAlert(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex min-h-screen flex-1 flex-col justify-center px-4 py-12 bg-white lg:px-8">
                <div className="mx-auto w-full max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1 text-black">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={HandleEmailChange}
                                    required
                                    autoComplete="email"
                                    className="block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 text-black">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={HandlePasswordChange}
                                    required
                                    autoComplete="current-password"
                                    className="block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={HandleSignInSubmit}
                                type="button"
                                className={`w-full flex justify-center rounded-md py-2 px-4 text-sm font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                                    }`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" />
                                            <path d="M4 12a8 8 0 018-8v0a8 8 0 018 8h0a8 8 0 01-8 8h0a8 8 0 01-8-8z" />
                                        </svg>
                                        <span>Loading...</span>
                                    </div>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}



export default function Page() {
    return (
        <>
            <Suspense fallback={'...Loading'}>
                <Navbar />
                <Login />
            </Suspense>
        </>
    )
}
