import { Outlet, useNavigate } from "react-router-dom";
import { Image, Layout, Menu, notification, theme, Modal, Badge, Avatar, Skeleton } from "antd";
import { AuditOutlined, LoginOutlined, MenuOutlined, TagsOutlined, UserOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { Footer, Header } from "antd/es/layout/layout";
import { FaUserTie } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FaFileContract } from "react-icons/fa";
import { MdOutlineClass } from "react-icons/md";
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
    'dash': '/dashboard',
    'dashboard': "/manager/dashboard",
    'task': '/task',
    'client': '/partner',
    'contract': '/contract',
    'setting1': '/bsinformation',
    'templateCreate': '/createtemplate',
    'appendix': '/appendix',
    'appendixManageStaff': '/appendix',
    'manageTemplate': '/managetemplate',
    'deletedtemplate': '/deletedtemplate',
    'clause': '/clause',
    'user': '/admin/user',
    'workflow': '/admin/process',
    'contractPartner': '/contractpartner',
    "createContract": "/createContract",
    'setting': '/manager/setting',
    "process": "/process",
    "DeleteContract": '/DeleteContract',
    "contractsApproval": "/contractsApproval",
    'approvalContract': '/manager/approvalContract',
    'approvalContractStaff': '/approvalContract',
    'department': '/admin/department',
    'managerAppendix': "/manager/appendix",
    'managerAppendixForallStatus': "/manager/appendixFull",
    '4': '/combo',
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
    { icon: FaUserTie, label: 'Khách hàng', key: "client" },
    // { icon: FaTasks, label: 'Task', key: "task" },
    { icon: GoLaw, label: 'Điều khoản và loại hợp đồng', key: "clause" },

    {
      icon: FaFileContract,
      label: 'Hợp đồng',
      badgeType: "contracts",
      children: [
        { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContract", badgeCount: "contractsPendingApprovalForManager" },
        { icon: MdOutlineClass, label: 'Quản lý hợp đồng', key: "contract" },
        { icon: FaFileCirclePlus, label: 'Tạo hợp đồng', key: "createContract" },
        { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "DeleteContract" },
        { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },

      ]
    },
    {
      icon: TagsOutlined,
      label: 'Phụ lục hợp đồng',
      badgeType: "addenda",
      children: [
        // { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContractStaff" },
        { icon: AuditOutlined, label: 'Phê duyệt phụ lục', key: "managerAppendix", default: true, badgeCount: "addendaPendingApprovalForManager" },
        { icon: MenuOutlined, label: 'Quản lý phụ lục', key: "managerAppendixForallStatus" },
        // { icon: FaFileCirclePlus, label: 'Tạo hợp đồng', key: "createContract" },
        // { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "DeleteContract" },
        // { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },
        // { icon: HiMiniClipboardDocumentCheck, label: 'Gửi yêu cầu phê duyệt', key: "contractsApproval" },

      ]
    },
    {
      icon: MdLibraryBooks, label: 'Template Hợp đồng', children: [
        { icon: MdOutlineClass, label: 'Template hợp đồng', key: "manageTemplate" },
        { icon: BsClipboard2DataFill, label: 'Tạo Template', key: "templateCreate" },
        { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "deletedtemplate" },
      ]
    },
    {
      icon: IoMdSettings, label: 'Cấu hình', key: "settingManagement", children: [
        { icon: AiFillIdcard, label: 'Thông tin doanh nghiệp', key: "setting1" },
        // { icon: SiAuth0, label: 'Phân quyền', key: "setting2" },
        { icon: IoMdSettings, label: 'Cấu hình', key: "setting" },
      ]
    },
    {
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item, index) => {
    return {
      key: item.key,
      icon: React.createElement(item.icon),
      label: item.label,
      children: item.children?.map((childItem, childIndex) => {
        const icon =
          childItem.badgeType &&
            numberNoti?.data[`${childItem.badgeType}PendingApprovalForManager`] > 0 ? (
            <Badge dot>
              {React.createElement(childItem.icon)}
            </Badge>
          ) : (
            React.createElement(childItem.icon)
          );
        return {
          icon: icon,
          key: childItem.key,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
            const grandchildIcon = grandchildItem.badgeCount ? (
              <Badge size="small" count={numberNoti?.data[grandchildItem.badgeCount] || 0}>
                {React.createElement(grandchildItem.icon)}
              </Badge>
            ) : (
              React.createElement(grandchildItem.icon)
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
      icon: LoginOutlined, key: "logout", label: 'Đăng xuất', onClick: handleLogout
    },
  ].map((item, index) => {
    return {
      key: item.key,
      icon: React.createElement(item.icon),
      label: item.label,
    };
  });


  const navStaff = [
    { icon: FaUserTie, label: 'Khách hàng', key: "client" },
    { icon: GoLaw, label: 'Quản lý điều khoản', key: "clause" },

    {
      icon: FaFileContract,
      label: 'Hợp đồng',
      badgeType: "contracts",
      children: [
        { icon: GoChecklist, label: 'Hợp đồng cần duyệt', key: "approvalContractStaff" },
        { icon: MdOutlineClass, label: 'Quản lý hợp đồng', key: "contract", default: true, badgeCount: "contractsPendingApproval" },
        { icon: FaFileCirclePlus, label: 'Tạo hợp đồng', key: "createContract" },
        { icon: BsTrash3Fill, label: 'Kho lưu trữ', key: "DeleteContract" },
        { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },
        { icon: HiMiniClipboardDocumentCheck, label: 'Gửi yêu cầu phê duyệt', key: "contractsApproval", badgeCount: "contractsRejected" },
      ]
    },
    {
      icon: TagsOutlined,
      label: 'Phụ lục hợp đồng',
      badgeType: "addenda",
      children: [
        { icon: AuditOutlined, label: 'Phê duyệt phụ lục', key: "appendix", badgeCount: "addendaRejected" },
        { icon: MenuOutlined, label: 'Quản lý phụ lục', key: "appendixManageStaff", default: true, badgeCount: "addendaPendingApproval" },
      ]
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
            {React.createElement(childItem.icon)}
          </Badge>
        ) : (
          React.createElement(childItem.icon)
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
                {React.createElement(grandchildItem.icon)}
              </Badge>
            ) : (
              React.createElement(grandchildItem.icon)
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
          items={user?.roles[0] == "ROLE_ADMIN" ? navAdmin : user?.roles[0] == "ROLE_MANAGER" ? navManager : navStaff}
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


