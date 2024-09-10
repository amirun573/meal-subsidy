"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleList } from "@/_Common/enum/role.enum";
import { GetLocalStorageDetails } from "@/_Common/function/Authentication";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import { GetRoleFromId } from "@/_Common/function/Role";
// Define an interface for your props
interface NavbarProps {
  role: RoleList; // Use the appropriate type for the role
}

interface NavBarInterface {
  id: number;
  name: string;
  link: string;
}



const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const [userDetails, setUserDetails] = useState<UserDetailsLocalStorage>();
  const [role, setRole] = useState<RoleList>(RoleList.EMPLOYEE);


  useEffect(() => {
    const GetUserDetailsLocalStorage = async (): Promise<UserDetailsLocalStorage | boolean> => {
      try {
        return await GetLocalStorageDetails(); // Assuming this returns a Promise
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    const fetchUserDetails = async () => {
      if (typeof window !== 'undefined') {
        try {
          const details = await GetUserDetailsLocalStorage();
          console.log("details==>", details);

          if (!details || typeof details === 'boolean') {
            throw Error("No Value or Invalid Data");
          }

          // Now it's safe to destructure since 'details' is guaranteed to be UserDetailsLocalStorage
          const {
            email,
            username,
            accessToken,
            role_id,
            uuid,
            country_code,
            is_acc_verify,
            profile_image,
            currency_code
          }: UserDetailsLocalStorage = details;

          const role = GetRoleFromId(role_id); // This will return RoleList.SUPER_ADMIN, etc.

          if (!role) {
            throw Error("No Role Detected");
          }

          setUserDetails({
            email, username, accessToken, role_id, uuid, country_code, is_acc_verify, profile_image, currency_code
          });

          setRole(role);
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchUserDetails(); // Call the async function only once
  }, []); // Empty dependency array ensures it runs only once





  const menuList: NavBarInterface[] = [

    {
      id: 2,
      name: "Scan QR Code",
      link: "/scan",
    },
    {
      id: 3,
      name: "Report",
      link: "/report",
    },
  ];

  let rolePathSignUp = "customer";



  return (
    <div>
      <nav className="bg-white border-gray-200 dark:bg-gray-900 fixed top-0 left-0 right-0 z-50 shadow text-black">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-black">
              Meal Subsidy
            </span>
          </a>
          <button
            onClick={toggleNavbar}
            type="button"
            className="inline-flex items-center p-1 w-8 h-8 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-expanded={isOpen ? "true" : "false"}
            aria-controls="navbar-default"
          >
            {/* <span className="sr-only">Open main menu</span> */}
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>

          <div
            className={`w-full md:flex md:items-center md:w-auto ${isOpen ? "block" : "hidden"}`}
            id="navbar-default"
          >
            <ul className="font-medium flex flex-col p-4 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 border-t border-gray-100 md:border-0 bg-gray-50 md:bg-transparent dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              {menuList.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.link}
                    className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center space-x-4 mt-4"></div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
