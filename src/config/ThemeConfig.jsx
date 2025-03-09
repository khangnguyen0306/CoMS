import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, ConfigProvider, Popover, theme, Tooltip } from 'antd';
import Icon from '@ant-design/icons';

export const ThemeProvider = ({ children }) => {
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    const themeConfig = {
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: '#1890ff',
        },
        components: {
            Table: {
                colorBgContainer: isDarkMode ? '#141414' : '#ffffff',
                colorText: isDarkMode ? '#ffffff' : '#000000',
            },
            Card: {
                colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
            },
            Modal: {
                colorBgElevated: isDarkMode ? '#1f1f1f' : '#ffffff',
            },
            Collapse: {
                headerBg: isDarkMode ? '#1f1f1f' : '#27a2f0',
                colorTextHeading: '#ffffff',
                motionDurationMid: '0.15s',
                motionDurationSlow: '0.15s',
            },
            Button: {
                colorBgContainer: isDarkMode ? "#4b5563" : "#ffffff",
                colorPrimary: isDarkMode ? "#4b5563" : "#5db6ff",

            },
            Icon: {
                style: { color: '#4b5563' },
            },
            Popover:{
                colorText: isDarkMode ? "#ffffff" : "#141414",
                colorBgElevated: isDarkMode ? "#1f1f1f" : "#ffffff"
            }
        },
    };

    return (
        <ConfigProvider theme={themeConfig}>
            {children}
        </ConfigProvider>
    );
};