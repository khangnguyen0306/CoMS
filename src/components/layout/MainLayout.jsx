import { Outlet } from "react-router-dom";
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
const { Content, Sider } = Layout;
////////////////////////////////////////

const subnav = ['1', '2', '3'].map((key) => ({
  key,
  label: `nav ${key}`,
}));


const nav = [
  {
    icon: MdDashboard, label: 'Danh mục', children: [
      { icon: FaUserTie, label: 'Khách hàng' },
      {
        icon: FaFileContract, label: 'Hợp đồng', children: [
          { icon: MdOutlineClass, label: 'Loại hợp đồng' },
          { icon: BsClipboard2DataFill, label: 'Trạng thái`' }, 
          { icon: FaHistory, label: 'Đã hủy / Tái Ký' },
          { icon: BsTrash3Fill, label: 'Đã xóa' },
        ]
      },
      {
        icon: MdLibraryBooks, label: 'Template Hợp đồng', children: [
          { icon: MdOutlineClass, label: 'Loại hợp đồng' },
          { icon: BsClipboard2DataFill, label: 'Trạng thái`' },
          { icon: FaHistory, label: 'Hủy / Tái Ký' },
          { icon: BsTrash3Fill, label: 'Đã xóa' },
        ]
      },
    ]
  },
  {
    icon: SiAuth0, label: 'Phân quyền', children: [
      { icon: MdDashboard, label: 'Danh mục', children: [] },
      { icon: SiAuth0, label: 'Phân quyền', children: [] },
      { icon: IoMdSettings, label: 'Cấu hình', children: [] },
    ]
  },
  {
    icon: IoMdSettings, label: 'Cấu hình', children: [
      { icon: MdDashboard, label: 'Danh mục', children: [] },
      { icon: SiAuth0, label: 'Phân quyền', children: [] },
      { icon: IoMdSettings, label: 'Cấu hình', children: [] },
    ]
  },
].map((item, index) => {
  const key = String(index + 1);
  return {
    key: `sub${key}`,
    icon: React.createElement(item.icon),
    label: item.label,
    children: item.children.map((childItem, childIndex) => {
      const subKey = `${key}-${childIndex + 1}`;
      return {
        icon: React.createElement(childItem.icon),
        key: `subnav${subKey}`,
        label: childItem.label,
        children: childItem.children && childItem.children.length > 0 ? childItem.children.map((grandchildItem, grandchildIndex) => {
          const subgrandKey = `${key}-${childIndex + 1}-${grandchildIndex + 1}`;
          return {
            icon: React.createElement(grandchildItem.icon),
            key: `subgrandKey${subgrandKey}`,
            label: grandchildItem.label
          }
        }) : null,
      };
    }),
  };
});

////////////////////////////////////////


const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG, ...other },
  } = theme.useToken();
  return (
    <Layout>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="px-9 bg-slate-400 mr-10" >
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

      <Layout>

        <Sider
          theme="dark"
          collapsed={collapsed}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
          width={'fit-content'}
          style={{
            background: colorBgContainer,
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            defaultOpenKeys={['sub1']}
            style={{
              height: '100%',
              borderRight: 0,
            }}
            items={nav}
          />
        </Sider>

        {/* Nội dung  */}

        <Layout
          style={{
            padding: '0 24px 24px',
          }}
        >

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
          />

          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
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


