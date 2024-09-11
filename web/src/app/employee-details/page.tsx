import Navbar from "@/Components/Navbar";
import { Suspense } from "react";


const EmployeeDetails = () => {

    return (<>

    </>);
}


const Page = () => {
    return (
        <Suspense fallback={'...Loading'}>
            <Navbar/>
            <EmployeeDetails />
        </Suspense>
    );
};

export default Page;