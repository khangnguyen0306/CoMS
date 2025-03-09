import { createBrowserRouter } from "react-router-dom";
import Loadable from "./Loadable";
import MainLayout from "../components/layout/MainLayout";
import AuthGuard from "./AuthGuard";
import AdminGuard from "./AdminGuard";
import ManagerGuard from "./ManagerGuard";

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
const UserManagement = Loadable({ loader: () => import("../pages/user/UserManagement") });
const ApprovalProcess = Loadable({ loader: () => import("../pages/ApprovalProcess/ApprovalProcess") });
const ContractPartner = Loadable({ loader: () => import("../pages/Contract/ContractPartner") });
const CreateContract = Loadable({ loader: () => import("../pages/Contract/CreateContract") });
const Setting = Loadable({ loader: () => import("../pages/setting/Setting") });
const Process = Loadable({ loader: () => import("../pages/Process/Process") });
const ContractApproval = Loadable({ loader: () => import("../pages/ApprovalProcess/ContractProcess") });
const ManagerContractApproval = Loadable({ loader: () => import("../pages/ApprovalProcess/ManageContractApproval") });
const PreviewContract = Loadable({ loader: () => import("../pages/ApprovalProcess/ReviewContract") });
const Approve = Loadable({ loader: () => import("../pages/ApprovalProcess/Approve") });
const ContractDetail = Loadable({ loader: () => import("../pages/Contract/ContractDetail") });
const EditTemplate = Loadable({ loader: () => import("../pages/template/EditTemplate") });
const DeleteContract = Loadable({ loader: () => import("../pages/Contract/DeleteContract") });
const ChatTest = Loadable({ loader: () => import("../components/AI-Gen/ChatTest") });



export const router = createBrowserRouter([

    {
        index: true,
        path: "/login",
        element: Login,
    },
    {
        path: "/chat",
        element: ChatTest,
    },
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <AuthGuard />,
                children: [
                    {
                        index: true,
                        element: Contract,
                    },
                    {
                        path: "/contract",
                        element: Contract,
                    },
                    {
                        path: "bsinformation",
                        element: BussinessInfor,
                    },
                    {
                        path: "profile/:id",
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
                        path: "clause",
                        element: Clause,
                    },
                    {
                        path: "contractpartner",
                        element: ContractPartner,
                    },
                    {
                        path: "createContract",
                        element: CreateContract,
                    },
                    {
                        path: "process",
                        element: Process,
                    },
                    {
                        path: "contractsApproval",
                        element: ContractApproval,
                    },
                    {
                        path: "EditTemplate/:id",
                        element: EditTemplate,
                    },
                    {
                        path: "DeleteContract",
                        element: DeleteContract,
                    },
                ],
            },
            {
                path: "/admin",
                element: <AdminGuard />,
                children: [
                    {
                        index: true,
                        element: Dashboard,
                    },
                    {
                        path: "user",
                        element: UserManagement,
                    },
                    {
                        path: "process",
                        element: ApprovalProcess,
                    },
                    {
                        path: "profile/:id",
                        element: Profile,
                    },
                ],
            },
            {
                path: "/manager",
                element: <ManagerGuard />,
                children: [
                    {
                        index: true,
                        element: Dashboard,
                    },
                    {
                        path: "dashboard",
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
                        path: "profile/:id",
                        element: Profile,
                    },
                    {
                        path: "partner",
                        element: Partner,
                    },
                    {
                        path: "partyId/:id",
                        element: DetailPartner,
                    },
                    {
                        path: "task",
                        element: Task,
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
                        path: "clause",
                        element: Clause,
                    },
                    {
                        path: "contractpartner",
                        element: ContractPartner,
                    },
                    {
                        path: "approvalContract",
                        element: ManagerContractApproval,
                    },
                    {
                        path: "approvalContract/reviewContract/:id",
                        element: PreviewContract,
                    },
                    {
                        path: "approvalContract/reviewContract/:id/approve/:id",
                        element: Approve,
                    },
                    {
                        path: "setting",
                        element: Setting,
                    },
                    {
                        path: "ContractDetail/:id",
                        element: ContractDetail,
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        element: MaintenancePage,
    }
]);
