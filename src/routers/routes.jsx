import { createBrowserRouter } from "react-router-dom";
import Loadable from "./Loadable";
import MainLayout from "../components/layout/MainLayout";
import AuthGuard from "./AuthGuard";
import AdminGuard from "./AdminGuard";
import ManagerGuard from "./ManagerGuard";
import DirectorGuard from "./DiarectorGuard";
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
const ContractPartner = Loadable({ loader: () => import("../pages/Contract/TestContractParrtner") });
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
const EditContract = Loadable({ loader: () => import("../pages/Contract/EditContract") });
const ChatTest = Loadable({ loader: () => import("../components/AI-Gen/ChatTest") });
const Compare = Loadable({ loader: () => import("../components/CompareVersion/Compare") });
const Department = Loadable({ loader: () => import("../pages/Department/Department") });
const CreateAppendix = Loadable({ loader: () => import("../pages/appendix/staff/CreateApependix") });
const AppendixManagement = Loadable({ loader: () => import("../pages/appendix/staff/AppendixManagement") });
const AppendixApproveStaff = Loadable({ loader: () => import("../pages/appendix/staff/AppendixApprove") });
const AppendixManagerManagement = Loadable({ loader: () => import("../pages/appendix/manager/AppendixManagementManager") });
const AppendixManagerManagementAll = Loadable({ loader: () => import("../pages/appendix/manager/AppendixManagementForAllStatus") });
const AppendixDetail = Loadable({ loader: () => import("../pages/appendix/AppendixDetail") });
const CreateContractPDF = Loadable({ loader: () => import("../pages/Contract/CreateContractPDF") });
const contractReadyToSign = Loadable({ loader: () => import("../pages/Contract/signContract/ContractReadyToSign") });
const signContract = Loadable({ loader: () => import("../pages/Contract/signContract/SignContract") });
const ProfileDetaiUser = Loadable({ loader: () => import("../pages/Profile/ProfileDetail") });
const ErrorPage = Loadable({ loader: () => import("../routers/ErrorPage") });
const EditAppendix = Loadable({ loader: () => import("../pages/appendix/staff/EditAppendix") });
const ContractNearlyExpired = Loadable({ loader: () => import("../pages/Contract/ContractNearlyExpired") });


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
        errorElement: <ErrorPage />,
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
                        path: "profile",
                        element: Profile,
                    },
                    {
                        path: "profileUser/:id",
                        element: ProfileDetaiUser,
                    },
                    {
                        path: "partner",
                        element: Partner,
                    },
                    {
                        path: "partner/:id",
                        element: DetailPartner,
                    },
                    // {
                    //     path: "createtemplate",
                    //     element: CreateTemplate,
                    // },
                    {
                        path: "managetemplate",
                        element: ManageTemplate,
                    },
                    // {
                    //     path: "deletedtemplate",
                    //     element: DeletedTemplate,
                    // },
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
                        path: "createContractPDF",
                        element: CreateContractPDF,
                    },
                    // {
                    //     path: "process",
                    //     element: Process,
                    // },
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
                        element: ContractDetail,
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
                    {
                        path: "EditContract/:id",
                        element: EditContract,
                    },
                    {
                        path: "ContractDetail/:id",
                        element: ContractDetail,
                    },
                    {
                        path: "compare/:contractId/:nowVersion/:preVersion",
                        element: Compare,
                    },
                    {
                        path: "CreateAppendix",
                        element: CreateAppendix,
                    },
                    {
                        path: "EditAppendix/:contractId/:appendixId",
                        element: EditAppendix,
                    },
                    {
                        path: "appendix",
                        element: AppendixManagement,
                    },
                    {
                        path: "approve/appendix",
                        element: AppendixApproveStaff,
                    },
                    {
                        path: "appendixDetail/:contractId/:appendixId",
                        element: AppendixDetail,
                    }
                ],
            },
            {
                path: "/admin",
                element: <AdminGuard />,
                children: [
                    {
                        index: true,
                        path: "user",
                        element: UserManagement,
                    },
                    {
                        path: "process",
                        element: ApprovalProcess,
                    },
                    {
                        path: "department",
                        element: Department,
                    },
                    {
                        path: "profile",
                        element: Profile,
                    },
                    {
                        path: "createtemplate",
                        element: CreateTemplate,
                    },
                    {
                        path: "EditTemplate/:id",
                        element: EditTemplate,
                    },
                    {
                        path: "managetemplate",
                        element: ManageTemplate,
                    },
                    {
                        path: "deletedtemplate",
                        element: DeletedTemplate,
                    },
                ],
            },
            {
                path: "/manager",
                element: <ManagerGuard />,
                children: [
                    {
                        index: true,
                        path: "contract",
                        element: Contract,
                    },
                    {
                        path: "profile",
                        element: Profile,
                    },
                    // {
                    //     path: "partner",
                    //     element: Partner,
                    // },
                    // {
                    //     path: "partyId/:id",
                    //     element: DetailPartner,
                    // },
                    // {
                    //     path: "createtemplate",
                    //     element: CreateTemplate,
                    // },
                    // {
                    //     path: "managetemplate",
                    //     element: ManageTemplate,
                    // },
                    // {
                    //     path: "deletedtemplate",
                    //     element: DeletedTemplate,
                    // },
                    // {
                    //     path: "contractpartner",
                    //     element: ContractPartner,
                    // },
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
                        element: ContractDetail,
                    },
                    // {
                    //     path: "setting",
                    //     element: Setting,
                    // },
                    {
                        path: "ContractDetail/:id",
                        element: ContractDetail,
                    },
                    {
                        path: "appendix",
                        element: AppendixManagerManagement,
                    },
                    {
                        path: "appendixFull",
                        element: AppendixManagerManagementAll,
                    },
                    {
                        path: "appendixDetail/:contractId/:appendixId",
                        element: AppendixDetail,
                    },

                    // {
                    //     path: "contractReadyToSign",
                    //     element: contractReadyToSign,
                    // },
                    // {
                    //     path: "signContract/:contractId",
                    //     element: signContract,
                    // }
                ],
            },
            {
                path: "/director",
                element: <DirectorGuard />,
                children: [
                    {
                        index: true,
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
                        path: "profile",
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
                        element: ContractDetail,
                    },
                    {
                        path: "setting",
                        element: Setting,
                    },
                    {
                        path: "ContractDetail/:id",
                        element: ContractDetail,
                    },
                    {
                        path: "appendix",
                        element: AppendixManagerManagement,
                    },
                    {
                        path: "appendixFull",
                        element: AppendixManagerManagementAll,
                    },
                    {
                        path: "appendixDetail/:contractId/:appendixId",
                        element: AppendixDetail,
                    },
                    {
                        path: "contractReadyToSign",
                        element: contractReadyToSign,
                    },
                    {
                        path: "nearlyExpired",
                        element: ContractNearlyExpired,
                    },
                    {
                        path: "signContract/:contractId",
                        element: signContract,
                    }
                ],
            },
        ],
    },
    {
        path: "*",
        element: MaintenancePage,
    }
]);
