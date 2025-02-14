import { createBrowserRouter } from "react-router-dom";
import Loadable from "./Loadable";
import MainLayout from "../components/layout/MainLayout";

const Home = Loadable({ loader: () => import("../pages/Home") });
const Dashboard = Loadable({ loader: () => import("../pages/Dashboard/Dashboard") });
const Partner = Loadable({ loader: () => import("../pages/Partner/ManagePartner") });
const DetailPartner = Loadable({ loader: () => import("../pages/Partner/DetailParrtner") });
const Task = Loadable({ loader: () => import("../pages/Task_Manager/ManageTask") });
const DetailTask = Loadable({ loader: () => import("../pages/Task_Manager/DetailTask") });
const Profile = Loadable({ loader: () => import("../pages/Profile/Profile") });
const Login = Loadable({ loader: () => import("../pages/Authen/Login") });
const Contract = Loadable({ loader: () => import("../pages/Contract/ContractManagement") });
const MaintenancePage = Loadable({ loader: () => import("../components/layout/MaintenancePage") });
const BussinessInfor = Loadable({ loader: () => import("../pages/BussinessInfor/BussinessInfor") });
const CreateTemplate = Loadable({ loader: () => import("../pages/template/CreateTemplate") });
const ManageTemplate = Loadable({ loader: () => import("../pages/template/ManageTemplate") });
const DeletedTemplate = Loadable({ loader: () => import("../pages/template/DeletedTemplate") });
const Clause = Loadable({ loader: () => import("../pages/Clause/ManageClause") });
const ContractPartner = Loadable({ loader: () => import("../pages/Contract/ContractPartner") });

export const router = createBrowserRouter([
    {
        path: "/",
        element: Home,
    },
    {
        path: "/login",
        element: Login,
    },
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: Dashboard,
            },
            {
                path: "contract",
                element: Contract,
            },
            {
                path: "bsinformation",
                element: BussinessInfor,
            },
            {
                path: "dashboard",
                element: Dashboard,
            },
            {
                path: "profile",
                element: Profile,
            },
            {
                path: "partner",
                element: Partner,
            },
            {
                path: "partner/:id",
                element: DetailPartner,
            },
            {
                path: "task",
                element: Task,
            },
            {
                path: "clause",
                element: Clause,
            },
            {
                path: "task/:id",
                element: DetailTask,
            },
            {
                path: "createtemplate",
                element: CreateTemplate,
            },
            {
                path: "managetemplate",
                element: ManageTemplate,
            },
            {
                path: "deletedtemplate",
                element: DeletedTemplate,
            },
            {
                path: "contractpartner",
                element: ContractPartner,
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
