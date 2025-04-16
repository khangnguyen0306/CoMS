import { Outlet, useNavigate } from "react-router-dom";
import { Image, Layout, Menu, notification, theme, Modal, Badge, Avatar, Skeleton } from "antd";
import { AuditOutlined, CheckCircleFilled, LoginOutlined, MenuOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { Footer, Header } from "antd/es/layout/layout";
import { FaUserTie } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FaFileContract } from "react-icons/fa";
import { MdOutlineClass, MdClass } from "react-icons/md";
import { BsClipboard2DataFill } from "react-icons/bs"
import { BsTrash3Fill } from "react-icons/bs";
import { MdLibraryBooks } from "react-icons/md";
import { AiFillIdcard } from "react-icons/ai";
import { GoChecklist, GoLaw } from "react-icons/go";
import { FaHandshakeSimple } from "react-icons/fa6";
import LOGO from './../../assets/Image/letterC.svg'
import { logOut, selectCurrentUser } from "../../slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
const { Content, Sider } = Layout;
import { FaUserCog } from "react-icons/fa";
import { LuWaypoints } from "react-icons/lu";
import { FaFileCirclePlus } from "react-icons/fa6";
import RealTimeNotification from "../../pages/Noti/RealTimeNotiPay";
import NotificationDropdown from "../../pages/Noti/NotificationDropdown";
import { toggleTheme } from "../../slices/themeSlice";
import { HiMiniClipboardDocumentCheck } from "react-icons/hi2";
import "./button.css"
import { useGetNumberNotiForAllQuery } from "../../services/NotiAPI";
import { FaUserClock } from "react-icons/fa";
import { FaClock } from "react-icons/fa6";
import { IoIosSend } from "react-icons/io";
import { FcExpired } from "react-icons/fc";
import { IoIosCloseCircle } from "react-icons/io";
import { FaSwatchbook } from "react-icons/fa6";
import { PiStampFill } from "react-icons/pi";
import { AiFillSignature } from "react-icons/ai";
const MainLayout = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const avatar = useSelector((state) => state.auth.avartar);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const user = useSelector(selectCurrentUser);
  const { data: numberNoti, isLoading: loadingNumber } = useGetNumberNotiForAllQuery()

  const router = {
    '1': '/',
    'managerDashboard': "/manager/dashboard",
    'directorDashboard': "/director/dashboard",
    'task': '/task',
    'client': '/partner',
    'contract': '/contract',
    'setting1': '/bsinformation',
    'templateCreate': '/admin/createtemplate',
    'appendix': 'approve/appendix',
    'appendixManageStaff': 'appendix',
    'manageTemplate': '/admin/managetemplate',
    'deletedtemplate': '/admin/deletedtemplate',
    'clause': '/clause',
    'user': '/admin/user',
    'workflow': '/admin/process',
    'contractPartner': '/contractpartner',
    "createContract": "/createContract",
    'setting': '/director/setting',
    "process": "/process",
    "DeleteContract": '/DeleteContract',
    "contractsApproval": "/contractsApproval",
    'approvalContract': '/manager/approvalContract',
    'approvalContractCEO': '/director/approvalContract',
    'approvalContractCEO': '/director/approvalContract',
    'approvalContractStaff': '/approvalContract',
    'department': '/admin/department',
    'managerAppendix': "/manager/appendix",
    'directorAppendixSign': '/director/appendixSign',
    'directorManageAppendix': "/director/appendix",
    'managerAppendixForallStatus': "/manager/appendixFull",
    'contractsNeedSign': "/director/contractReadyToSign",
    'contractsSigned': "/contract?paramstatus=SIGNED",
    'contractsExpired': "/contract?paramstatus=EXPIRED",
    'contractsRejected': "/contract?paramstatus=REJECTED",
    '4': '/combo',
    'diarecAllApendix': '/director/appendixFull',
    'directorAppendixApprove': '/director/appendix?paramstatus=CREATED',
    'directorAppendixSign': '/appendix?paramstatus=APPROVED',
    'approveManager': '/contract?paramstatus=APPROVED',
    'sendAppendix': '/appendix?paramstatus=CREATED'
  }

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất không?',
      onOk() {
        dispatch(logOut());
        notification.success({
          message: "Đăng xuất thành công!",
          description: "Hẹn gặp lại!",
          duration: 1.5
        });
        navigate("/login");
      },
      okText: "Đăng xuất",
      cancelText: "Hủy"
    });
  }, [dispatch, navigate]);


  const navManager = [
    { icon: MdDashboard, label: 'Dashboard', key: "dashboard", default: true },
    {
      icon: FaFileContract,
      label: 'Hợp đồng',
      badgeType: "contracts",
      children: [
        { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContract", color: "#1890ff", badgeCount: "contractsPendingApprovalForManager" },
        { icon: MdClass, label: 'Tất cả hợp đồng', key: "contract", color: "#13c2c2" },
        { icon: CheckCircleFilled, label: 'Hợp đồng đã duyệt', key: "approveManager", color: "#52c41a" },
        { icon: IoIosCloseCircle, label: 'Hợp đồng đã từ chối ', key: "contractsRejected", color: "#f5222d" },
      ]
    },
    {
      icon: FaSwatchbook,
      label: 'Phụ lục hợp đồng',
      badgeType: "addenda",

      children: [
        { icon: PiStampFill, label: 'Phê duyệt phụ lục', key: "managerAppendix", default: true, badgeCount: "addendaPendingApprovalForManager", color: "#fa8c16" },
        { icon: MenuOutlined, label: 'Tất cả phụ lục', key: "managerAppendixForallStatus" },
      ]
    },
    {
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item, index) => {
    const hasBadgeDot = item.children?.some(child => numberNoti?.data?.[child.badgeCount] > 0);
    return {
      key: item.key,
      icon: hasBadgeDot ? (
        <Badge dot>
          {React.createElement(item.icon, { style: { color: item.color } })}
        </Badge>
      ) : (
        React.createElement(item.icon, { style: { color: item.color } })
      ),
      label: item.label,
      children: item.children?.map((childItem, childIndex) => {
        const childBadgeCount = numberNoti?.data?.[childItem.badgeCount] || 0;

        const icon = childBadgeCount > 0 ? (
          <Badge size="small" count={childBadgeCount}>
            {React.createElement(childItem.icon, { style: { color: childItem.color } })}
          </Badge>
        ) : (
          React.createElement(childItem.icon, { style: { color: childItem.color } })
        );

        return {
          icon: icon,
          key: childItem.key,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
            const grandchildIcon = grandchildItem.badgeCount ? (
              <Badge size="small" count={numberNoti?.data[grandchildItem.badgeCount] || 0}>
                {React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })}
              </Badge>
            ) : (
              React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })
            );
            return {
              icon: grandchildIcon,
              key: grandchildItem.key,
              label: grandchildItem.label,
              path: grandchildItem.path,
            }
          }) : null,
        };
      }),
    };
  });

  const navAdmin = [
    {
      icon: FaUserCog, key: "user", label: 'Quản lý tài khoản'
    },
    {
      icon: LuWaypoints, key: "workflow", label: 'Quy trình duyệt'
    },
    {
      icon: MdLibraryBooks,
      label: 'Mẫu Hợp đồng',
      children: [
        { icon: MdOutlineClass, label: 'Quản lý mẫu hợp đồng', key: "manageTemplate" },
        { icon: BsClipboard2DataFill, label: 'Tạo mẫu hợp đồng', key: "templateCreate" },
        { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "deletedtemplate" },
      ]
    },
    {
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item) => ({
    key: item.key,
    icon: React.createElement(item.icon),
    label: item.label,
    // onClick: item.onClick,
    children: item.children?.map((childItem) => ({
      key: childItem.key,
      icon: React.createElement(childItem.icon),
      label: childItem.label,
      path: childItem.path,
    })),
  }));


  const navStaff = [
    { icon: FaUserTie, label: 'Khách hàng', key: "client" },
    { icon: GoLaw, label: 'Quản lý điều khoản', key: "clause" },

    {
      icon: FaFileContract,
      label: 'Hợp đồng',
      badgeType: "contracts",
      children: [
        { icon: FaFileCirclePlus, label: 'Tạo hợp đồng', key: "createContract", color: "#1890ff" },
        { icon: MdOutlineClass, label: 'Tất cả hợp đồng', key: "contract", default: true, color: "#13c2c2" },
        { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContractStaff", badgeCount: "contractsAssignedToApprove", color: "#faad14" },
        { icon: HiMiniClipboardDocumentCheck, label: 'Gửi yêu cầu phê duyệt', key: "contractsApproval", badgeCount: "contractsRejected", color: "#722ed1" },
        { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner", color: "#52c41a" },
        { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "DeleteContract", color: "#f5222d" },
      ]
    },
    {
      icon: FaSwatchbook,
      label: 'Phụ lục hợp đồng',
      badgeType: "addenda",
      children: [
        { icon: PiStampFill, label: 'Phê duyệt phụ lục', key: "appendix", badgeCount: "addendaAssignedToApprove", color: "#fa8c16" },
        { icon: IoIosSend, label: 'Yêu cầu phê duyệt phụ lục', key: "sendAppendix", badgeCount: "addendaRejected", color: "#722ed1" },
        { icon: MenuOutlined, label: 'Tất cả phụ lục', key: "appendixManageStaff", default: true, badgeCount: "addendaPendingApproval", color: "#13c2c2" },
      ]
    },
    {
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item) => {
    // Kiểm tra nếu có bất kỳ icon con nào có badgeCount > 0 thì icon lớn sẽ có dấu chấm đỏ
    const hasBadgeDot = item.children?.some(child => numberNoti?.data?.[child.badgeCount] > 0);

    return {
      key: item.key,
      icon: hasBadgeDot ? (
        <Badge dot>
          {React.createElement(item.icon)}
        </Badge>
      ) : (
        React.createElement(item.icon)
      ),
      label: item.label,
      children: item.children?.map((childItem) => {
        const childBadgeCount = numberNoti?.data?.[childItem.badgeCount] || 0;

        const icon = childBadgeCount > 0 ? (
          <Badge size="small" count={childBadgeCount}>
            {React.createElement(childItem.icon, { style: { color: childItem.color } })}
          </Badge>
        ) : (
          React.createElement(childItem.icon, { style: { color: childItem.color } })
        );

        return {
          key: childItem.key,
          icon,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children?.map((grandchildItem) => {
            const grandchildBadgeCount = numberNoti?.data?.[grandchildItem.badgeCount] || 0;
            const grandchildIcon = grandchildBadgeCount > 0 ? (
              <Badge size="small" count={grandchildBadgeCount}>
                {React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })}
              </Badge>
            ) : (
              React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })
            );

            return {
              key: grandchildItem.key,
              icon: grandchildIcon,
              label: grandchildItem.label,
              path: grandchildItem.path,
            };
          }) || null,
        };
      }),
    };
  });


  const navDiarector = [
    { icon: MdDashboard, label: 'Dashboard', key: "directorDashboard", default: true },
    { icon: FaUserTie, label: 'Khách hàng', key: "client" },
    {
      icon: FaFileContract,
      label: 'Hợp đồng',
      badgeType: "contracts",
      children: [
        { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContractCEO", color: "#1890ff", badgeCount: "contractsPendingApprovalForManager" },
        { icon: MdClass, label: 'Tất cả hợp đồng', key: "contract", color: "#1890ff" },
        { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },
        { icon: FaClock, label: 'Hợp đồng chờ ký', key: "contractsNeedSign", color: "#faad14" },
        { icon: CheckCircleFilled, label: 'Hợp đồng đã ký', key: "contractsSigned", color: "#52c41a" },
        { icon: FcExpired, label: 'Hợp đồng đã hết hạn', key: "contractsExpired", color: "#f5222d" },
        { icon: IoIosCloseCircle, label: 'Hợp đồng đã từ chối ', key: "contractsRejected", color: "#f5222d" },
      ]
    },
    {
      icon: FaSwatchbook,
      label: 'Phụ lục hợp đồng',
      badgeType: "addenda",
      children: [
        { icon: PiStampFill, label: 'Phê duyệt phụ lục', key: "directorAppendixApprove", color: "#FF8247", badgeCount: "addendaRejected" },
        { icon: AiFillSignature, label: 'Phụ lục chờ ký', key: "directorAppendixSign", color: "#41a9ff" },
        { icon: MenuOutlined, label: 'Tất cả phụ lục', key: "diarecAllApendix", default: true, badgeCount: "addendaPendingApproval" },
      ]
    },
    {
      icon: IoMdSettings, label: 'Cấu hình', key: "settingManagement", color: "#", children: [
        { icon: AiFillIdcard, label: 'Thông tin doanh nghiệp', key: "setting1", color: "#1890ff" },
        { icon: IoMdSettings, label: 'Cài đặt khác', key: "setting", color: "#722ed1" },
      ]
    },
    {
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item, index) => {
    const hasBadgeDot = item.children?.some(child => numberNoti?.data?.[child.badgeCount] > 0);
    return {
      key: item.key,
      icon: hasBadgeDot ? (
        <Badge dot>
          {React.createElement(item.icon, { style: { color: item.color } })}
        </Badge>
      ) : (
        React.createElement(item.icon, { style: { color: item.color } })
      ),
      label: item.label,
      children: item.children?.map((childItem, childIndex) => {
        const childBadgeCount = numberNoti?.data?.[childItem.badgeCount] || 0;

        const icon = childBadgeCount > 0 ? (
          <Badge size="small" count={childBadgeCount}>
            {React.createElement(childItem.icon, { style: { color: childItem.color } })}
          </Badge>
        ) : (
          React.createElement(childItem.icon, { style: { color: childItem.color } })
        );

        return {
          icon: icon,
          key: childItem.key,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
            const grandchildIcon = grandchildItem.badgeCount ? (
              <Badge size="small" count={numberNoti?.data[grandchildItem.badgeCount] || 0}>
                {React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })}
              </Badge>
            ) : (
              React.createElement(grandchildItem.icon, { style: { color: grandchildItem.color } })
            );
            return {
              icon: grandchildIcon,
              key: grandchildItem.key,
              label: grandchildItem.label,
              path: grandchildItem.path,
            }
          }) : null,
        };
      }),
    };
  });


  const {
    token: { colorBgContainer, borderRadiusLG, ...other },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    const path = router[e.key];
    if (path) {
      navigate(path);
    }
    if (e.key === "logout") {
      handleLogout();
    }
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  if (loadingNumber) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <Skeleton />
      </div>
    )
  }
  return (
    <Layout>
      <Sider
        theme="dark"
        collapsed={collapsed}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        width={'fit-content'}
        style={{
          background: colorBgContainer,
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          bottom: '0px',
          scrollbarGutter: 'stable',
          scrollbarWidth: 'thin',
          insetInlineStart: 0,
          zIndex: '1000'
        }}
      >
        <Menu
          mode="inline"
          style={{
            height: '100%',
            borderRight: 0,
          }}
          items={
            user?.roles?.includes("ROLE_ADMIN")
              ? navAdmin
              : user?.roles?.includes("ROLE_DIRECTOR")
                ? navDiarector
                : user?.roles?.includes("ROLE_MANAGER")
                  ? navManager
                  : navStaff
          }
          onClick={handleMenuClick}
        />

      </Sider>
      <Layout style={{
        marginInlineStart: 80,
      }}>

        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'fixed',
            width: '100vw',
            zIndex: 100,
            backgroundColor: isDarkMode ? '#1f1f1f' : "#ffffff",
            padding: '0 20px',
          }}
        >
          <div className="flex items-center">
            <Image
              preview={false}
              src={LOGO}
              height={60}
              width={60}
              className="cursor-pointer p-2"
              onClick={() => navigate(user?.roles[0] == "ROLE_ADMIN" ? "/admin" : user?.roles[0] == "ROLE_MANAGER" ? "/manager/dashboard" : '/contract')}
              alt="Logo"
            />
            <p className={`ml-2 ${isDarkMode ? "text-white" : "text-black"}`}>Quản lý hợp đồng CoMS</p>
          </div>

          <div className="flex justify-center items-center mr-36">
            {/* <p className={`${isDarkMode ? "text-white" : "text-black"} mr-4`}>{user?.fullName}</p> */}
            {(user?.roles.includes("ROLE_STAFF") || user?.roles.includes("ROLE_MANAGER")) && <NotificationDropdown />}

            <Avatar
              size="large"
              src={avatar}
              // icon={!user.avatar && <UserOutlined />} 
              className="bg-slate-500 cursor-pointer ml-4 hover:border-2"
              onClick={() => navigate(`/profile/${user.id}`)}
            />
            <label className="switch ml-6" >
              <input
                checked={!isDarkMode}
                id="checkbox"
                type="checkbox"
                onChange={handleToggleTheme}
              />
              <span className="slider">
                <div className="star star_1"></div>
                <div className="star star_2"></div>
                <div className="star star_3"></div>
                <svg viewBox="0 0 16 16" className="cloud_1 cloud">
                  <path
                    transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                    fill="#fff"
                    d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                  ></path>
                </svg>
              </span>
            </label>




          </div>
        </Header>


        {/* Nội dung  */}

        <Layout
          style={{
            padding: '0 24px 24px',
            marginTop: '60px'
          }}
        >

          <Content
            style={{
              padding: 24,
              margin: 0,
              marginTop: 20,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            {(user?.roles?.includes("ROLE_STAFF") || user?.roles?.includes("ROLE_MANAGER")) && (
              <RealTimeNotification />
            )}
            <Outlet />
          </Content>

          {/* Phần footer */}

          <Footer
            style={{
              textAlign: 'center',
              marginBottom: -25,
              paddingBottom: 15,
            }}
          >
            Ant Design ©{new Date().getFullYear()} Created by Khang
          </Footer>



        </Layout>

      </Layout>

    </Layout>

  );
};

export default MainLayout;


