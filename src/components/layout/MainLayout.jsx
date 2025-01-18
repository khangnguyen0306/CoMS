import { Outlet, useNavigate } from "react-router-dom";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { LaptopOutlined, NotificationOutlined, UserOutlined } from "@ant-design/icons";
import React, { useState } from "react";
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
const { Content, Sider } = Layout;


const MainLayout = () => {

  const subnav = ['1', '2', '3'].map((key) => ({
    key,
    label: `nav ${key}`,
  }));

  const router = {
    '1': '/',
    'dash': '/dashboard',
    'client': '/partner',
    'contract': '/contract',
    'setting1':'/bsinformation',
    'templateCreate':'/createtemplate',
    '4': '/combo',
  }

  const nav = [
    {
      icon: MdDashboard, key: "all", label: 'Danh mục', children: [
        { icon: MdDashboard, label: 'Dashboard', key: "dash", default: true },
        { icon: FaUserTie, label: 'Khách hàng', key: "client" },
        {
          icon: FaFileContract, label: 'Hợp đồng', children: [
            { icon: MdOutlineClass, label: 'Loại hợp đồng', key: "contract" },
            { icon: BsClipboard2DataFill, label: 'Trạng thái', key: "contractStatus" },
            { icon: FaHistory, label: 'Đã hủy / Tái Ký', key: "contractHistory" },
            { icon: BsTrash3Fill, label: 'Đã xóa', key: "contractDelete" },
          ]
        },
        {
          icon: MdLibraryBooks, label: 'Template Hợp đồng', children: [
            { icon: MdOutlineClass, label: 'Template hợp đồng', key: "contractType1" },
            { icon: BsClipboard2DataFill, label: 'Tạo Template', key: "templateCreate" },
            { icon: FaHistory, label: 'Hủy / Tái Ký', key: "contractType3" },
            { icon: BsTrash3Fill, label: 'Đã xóa', key: "contractType4" },
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
  ].map((item, index) => {
    return {
      key: item.key,
      icon: React.createElement(item.icon),
      label: item.label,
      children: item.children.map((childItem, childIndex) => {
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

  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);


  const {
    token: { colorBgContainer, borderRadiusLG, ...other },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    console.log(e)
    const path = router[e.key];
    if (path) {
      navigate(path);
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
          items={nav}
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
            position: 'fixed',
            width: '100vw',
            zIndex: 100,
          }}
        >
          <div className="px-9 bg-slate-400 mr-10" onClick={() => navigate('/')}>
            Logo
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['2']}
            items={subnav}
            style={{
              flex: 1,
              minWidth: 0,
            }}
          />
        </Header>
        {/* Nội dung  */}

        <Layout
          style={{
            padding: '0 24px 24px',
            marginTop: '60px'
          }}
        >
{/* 
          <Breadcrumb
            items={[
              {
                title: 'Home',
              },
              {
                title: 'List',
              },
              {
                title: 'App',
              },
            ]}
            style={{
              margin: '16px 0',
            }}
          /> */}

          <Content
            style={{
              padding: 24,
              margin: 0 ,
              marginTop:20,
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


