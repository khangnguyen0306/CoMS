import { Outlet, useNavigate } from "react-router-dom";
import { Breadcrumb, Button, Image, Layout, Menu, notification, theme, Modal } from "antd";
import { LaptopOutlined, LoginOutlined, NotificationOutlined, UserOutlined } from "@ant-design/icons";
import React, { useCallback, useState } from "react";
import { Footer, Header } from "antd/es/layout/layout";
import { FaUserTie } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { SiAuth0 } from "react-icons/si";
import { FaFileContract } from "react-icons/fa";
import { MdOutlineClass } from "react-icons/md";
import { FaHistory } from "react-icons/fa";
import { BsClipboard2DataFill } from "react-icons/bs"
import { BsTrash3Fill } from "react-icons/bs";
import { MdLibraryBooks } from "react-icons/md";
import { AiFillIdcard } from "react-icons/ai";
import { FaTasks } from "react-icons/fa";
import { GoLaw } from "react-icons/go";
import { FaHandshakeSimple } from "react-icons/fa6";
import LOGO from './../../assets/Image/letter-c.svg'
import { logOut, selectCurrentUser } from "../../slices/auth.slice";
import { useDispatch, useSelector } from "react-redux";
const { Content, Sider } = Layout;
import { FaUserCog } from "react-icons/fa";
import { LuWaypoints } from "react-icons/lu";
const MainLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const user = useSelector(selectCurrentUser)

  const router = {
    '1': '/',
    'dash': '/dashboard',
    'dashboard': "/manager/dashboard",
    'task': '/task',
    'client': '/partner',
    'contract': '/contract',
    'setting1': '/bsinformation',
    'templateCreate': '/createtemplate',
    'manageTemplate': '/managetemplate',
    'deletedtemplate': '/deletedtemplate',
    'clause': '/clause',
    'user': '/admin/user',
    'contractPartner': '/contractpartner',
    '4': '/combo',
  }

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc chắn muốn đăng xuất không?',
      onOk() {
        dispatch(logOut());
        notification.success({
          message: "Logout successfully",
          description: "See you again!",
          duration: 1.5
        });
        navigate("/login");
      },
    });
  }, [dispatch, navigate]);

  const navManager = [
    {
      icon: MdDashboard, key: "all", label: 'Danh mục', children: [
        { icon: MdDashboard, label: 'Dashboard', key: "dashboard", default: true },
        { icon: FaUserTie, label: 'Khách hàng', key: "client" },
        { icon: FaTasks, label: 'Task', key: "task" },
        { icon: GoLaw, label: 'Clause', key: "clause" },
        {
          icon: FaFileContract, label: 'Hợp đồng', children: [
            { icon: MdOutlineClass, label: 'Quản lý hợp đồng', key: "contract" },
            { icon: BsClipboard2DataFill, label: 'Trạng thái', key: "contractStatus" },
            { icon: FaHistory, label: 'Đã hủy / Tái Ký', key: "contractHistory" },
            { icon: BsTrash3Fill, label: 'Đã xóa', key: "contractDelete" },
            { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },
          ]
        },
        {
          icon: MdLibraryBooks, label: 'Template Hợp đồng', children: [
            { icon: MdOutlineClass, label: 'Template hợp đồng', key: "manageTemplate" },
            { icon: BsClipboard2DataFill, label: 'Tạo Template', key: "templateCreate" },
            { icon: BsTrash3Fill, label: 'Đã xóa', key: "deletedtemplate" },
          ]
        },
      ]
    },
    {
      icon: SiAuth0, key: "right", label: 'Phân quyền', children: [
        { icon: MdDashboard, label: 'Danh mục', key: "author" },
        { icon: SiAuth0, label: 'Phân quyền', key: "author1" },
        { icon: IoMdSettings, label: 'Cấu hình', key: "author2" },
      ]
    },
    {
      icon: IoMdSettings, label: 'Cấu hình', key: "setting", children: [
        { icon: AiFillIdcard, label: 'Thông tin doanh nghiệp', key: "setting1" },
        { icon: SiAuth0, label: 'Phân quyền', key: "setting2" },
        { icon: IoMdSettings, label: 'Cấu hình', key: "setting3" },
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
        return {
          icon: React.createElement(childItem.icon),
          key: childItem.key,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
            return {
              icon: React.createElement(grandchildItem.icon),
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
    // { icon: FaTasks, label: 'Task', key: "task" },
    { icon: GoLaw, label: 'Clause', key: "clause" },
    {
      icon: FaFileContract, label: 'Hợp đồng', children: [
        { icon: MdOutlineClass, label: 'Quản lý hợp đồng', key: "contract", default: true },
        { icon: BsClipboard2DataFill, label: 'Trạng thái', key: "contractStatus" },
        { icon: FaHistory, label: 'Đã hủy / Tái Ký', key: "contractHistory" },
        { icon: BsTrash3Fill, label: 'Đã xóa', key: "contractDelete" },
        { icon: FaHandshakeSimple, label: 'Hợp đồng đối tác', key: "contractPartner" },
      ]
    },
    {
      icon: MdLibraryBooks, label: 'Template Hợp đồng', children: [
        { icon: MdOutlineClass, label: 'Template hợp đồng', key: "manageTemplate" },
        { icon: BsClipboard2DataFill, label: 'Tạo Template', key: "templateCreate" },
        { icon: BsTrash3Fill, label: 'Đã xóa', key: "deletedtemplate" },
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
        return {
          icon: React.createElement(childItem.icon),
          key: childItem.key,
          label: childItem.label,
          path: childItem.path,
          children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
            return {
              icon: React.createElement(grandchildItem.icon),
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
    // console.log(e)
    const path = router[e.key];
    if (path) {
      navigate(path);
    }
    if (e.key === "logout") {
      handleLogout();
    }
  };


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
            backgroundColor: '#1f1f1f',
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
            <p className="ml-2 text-white">Quản lý hợp đồng CoMS</p>
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
            <Outlet />
          </Content>

          {/* Phần footer */}

          <Footer
            style={{
              textAlign: 'center',
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


