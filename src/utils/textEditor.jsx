import {
    BaseKit,
    Bold,
    BulletList,
    Clear,
    Color,
    ColumnActionButton,
    ExportWord,
    FontFamily,
    FontSize,
    Heading,
    Highlight,
    History,
    HorizontalRule,
    Image,
    ImportWord,
    Indent,
    Italic,
    Link,
    Mention,
    OrderedList,
    SearchAndReplace,
    SlashCommand,
    Strike,
    Table,
    TextAlign,
    Underline,
} from 'reactjs-tiptap-editor/extension-bundle'

export const extensions = [
    BaseKit.configure({
    }),
    History,
    SearchAndReplace,
    Clear,
    FontFamily,
    Heading.configure({ spacer: true }),
    FontSize,
    Bold,
    Italic,
    Underline,
    Strike,
    Color.configure({ spacer: true }),
    Highlight,
    BulletList,
    OrderedList,
    TextAlign.configure({ types: ['heading', 'paragraph'], spacer: true }),
    Indent,
    Link,
    Image.configure({
        upload: (files) =>
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(URL.createObjectURL(files));
                }, 500);
            }),
    }),
    SlashCommand,
    HorizontalRule,
    ColumnActionButton,
    Table,
    ImportWord.configure({
        upload: (files) => {
            console.log("Files received for upload:", files);
            const f = files.map((file) => {
                const url = URL.createObjectURL(file);
                return {
                    src: url,
                    alt: file.name,
                };
            });
            return Promise.resolve(f);
        },
    }),
    ExportWord,
    Mention,
];