
// import React, { lazy, Suspense, useMemo } from 'react'
// import { extensions } from "../../../utils/textEditor";
// import { useSelector } from 'react-redux';

// export const ContractContentEditor = ({ content, onValueChange}) => {
//     const isDarkMode = useSelector((state) => state.theme.isDarkMode);
//     const RichTextEditor = lazy(() => import('reactjs-tiptap-editor'));
//     const memoizedExtensions = useMemo(() => extensions, []);
//     const memoizedDarkMode = useMemo(() => isDarkMode, [isDarkMode]);
//     return (
//         <RichTextEditor
//             output="html"
//             content={content}
//             onChangeContent={onValueChange}
//             extensions={memoizedExtensions}
//             dark={memoizedDarkMode}
//             placeholder="Nhập nội dung hợp đồng tại đây..."
//         />
//     );
// };