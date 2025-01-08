import { createBrowserRouter } from "react-router-dom";
import Loadable from "./Loadable";
import MainLayout from "../components/layout/MainLayout";
const Home = Loadable({ loader: () => import("../pages/Home") });
const MaintenancePage = Loadable({ loader: () => import("../components/layout/MaintenancePage") });
export const router = createBrowserRouter([
    {
        path: "/",
        element: Home,
    },
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: Home,
            },
            // {
            //     path: "/",
            //     element: <AuthGuard />,
            //     children: [
            //         {
            //             index: true,
            //             element: Home,
            //         },
            //         {
            //             path: "profile",
            //             element: Profile,
            //         },
            //         {
            //             path: "/booking",
            //             element: BookingPage,
            //         },
            //         {
            //             path: "/manageBooking",
            //             element: ManageBooking,
            //         },
            //     ],
            // },
        ],
    },
    {
        path: "*",
        element: MaintenancePage,
    }
]);
