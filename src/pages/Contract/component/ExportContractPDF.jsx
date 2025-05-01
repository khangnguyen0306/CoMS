import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useLazyGetContractDetailQuery } from "../../../services/ContractAPI";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { convert } from "html-to-text";
import { numberToVietnamese } from "../../../utils/ConvertMoney";
import { useLazyGetTermDetailQuery } from "../../../services/ClauseAPI";

pdfMake.vfs = pdfFonts.vfs;


const ExportContractPDF = ({ contractId, onDone }) => {
  const [getContractDetail, { data: contract, isSuccess }] = useLazyGetContractDetailQuery();

  const [groupedTerms, setGroupedTerms] = useState(
    { A: [], B: [], Common: [] }
  );

  const [fetchTerms] = useLazyGetTermDetailQuery();

  useEffect(() => {
    if (contractId) {
      getContractDetail(contractId);
    }
  }, [contractId]);

  console.log(contract)

  const parseDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
    const [year, month, day, hour, minute] = dateArray;
    return new Date(year, month - 1, day, hour, minute);
  };



  const rawText = convert(contract?.data.contractContent, {
    wordwrap: false,
  });
  const lines = rawText.split('\n');

  useEffect(() => {
    if (contract?.data?.additionalConfig) {
      const allGrouped = { Common: [], A: [], B: [] };

      Object.values(contract.data.additionalConfig).forEach((config) => {
        // Group Common terms
        if (config.Common && config.Common.length > 0) {
          config.Common.forEach((termObj) => {
            allGrouped.Common.push(termObj.value);
          });
        }

        // Group A terms
        if (config.A && config.A.length > 0) {
          config.A.forEach((termObj) => {
            allGrouped.A.push(termObj.value);
          });
        }

        // Group B terms
        if (config.B && config.B.length > 0) {
          config.B.forEach((termObj) => {
            allGrouped.B.push(termObj.value);
          });
        }
      });

      // Optionally remove duplicates
      groupedTerms.A = [...new Set(allGrouped.A)];
      groupedTerms.B = [...new Set(allGrouped.B)];
      groupedTerms.Common = [...new Set(allGrouped.Common)];

    }
  }, [contract?.data]);



  useEffect(() => {
    if (isSuccess && contract) {
      const hasContractItems = contract.data.contractItems.length > 0;
      const hasPaymentSchedules = contract.data.paymentSchedules.length > 0;

      const paymentSection = hasContractItems || hasPaymentSchedules ? [
        { text: "GIÁ TRỊ VÀ THANH TOÁN", style: "titleDescription", decoration: 'underline', margin: [0, 10, 0, 0] },
        hasContractItems && {
          text: [
            { text: `- Tổng giá trị hợp đồng: ${new Intl.NumberFormat('vi-VN').format(contract?.data.amount)} VND  ` },
            { text: `( ${numberToVietnamese(contract?.data.amount)} )` }
          ],
          margin: [5, 9, 0, 9],
          fontSize: 11
        },
        hasContractItems && {
          text: [
            { text: `1. Hạng mục thanh toán` }
          ],
          margin: [0, 9, 0, 9],
          fontSize: 11,
          bold: true,
        },
        hasContractItems && {
          style: "table",
          table: {
            widths: ["auto", "*", "auto"],
            body: [
              [
                { text: "STT", style: "tableHeader" },
                { text: "Nội dung", style: "tableHeader" },
                { text: "Số tiền (VND)", style: "tableHeader" },
              ],
              ...contract.data.contractItems.map(item => [
                { text: item.itemOrder, style: "tableCell" },
                { text: item.description, style: "tableCell" },
                { text: new Intl.NumberFormat('vi-VN').format(item.amount), style: "tableCell" },
              ]),
            ],
          },
          layout: {
            hLineWidth: function (i, node) { return 1; },
            vLineWidth: function (i, node) { return 1; },
            hLineColor: function (i, node) { return 'black'; },
            vLineColor: function (i, node) { return 'black'; },
            paddingLeft: function (i, node) { return 5; },
            paddingRight: function (i, node) { return 5; },
            paddingTop: function (i, node) { return 5; },
            paddingBottom: function (i, node) { return 5; },
          },
        },
        hasPaymentSchedules && {
          text: [
            { text: `2. Tổng giá trị và số lần thanh toán` }
          ],
          margin: [0, 9, 0, 9],
          fontSize: 11,
          bold: true,
        },
        hasPaymentSchedules && {
          style: "table",
          table: {
            widths: ["auto", "*", "*", "auto"],
            body: [
              [
                { text: "Đợt", style: "tableHeader" },
                { text: "Số tiền (VND)", style: "tableHeader" },
                { text: "Ngày thanh toán", style: "tableHeader" },
                { text: "Phương thức thanh toán", style: "tableHeader" },
              ],
              ...contract.data.paymentSchedules.map(item => [
                { text: item.paymentOrder, style: "tableCell" },
                { text: item.amount, style: "tableCell" },
                { text: `Ngày ${dayjs(parseDate(item.paymentDate)).format("DD")} tháng ${dayjs(parseDate(item.paymentDate)).format("MM")} năm ${dayjs(parseDate(item.paymentDate)).format("YYYY")}`, style: "tableCell" },
                {
                  text: item.paymentMethod === 'cash'
                    ? 'Tiền mặt'
                    : item.paymentMethod === 'creditCard'
                      ? 'Thẻ tín dụng'
                      : 'Chuyển khoản', style: "tableCell"
                },
              ]),
            ],
          },
          layout: {
            hLineWidth: function (i, node) { return 1; },
            vLineWidth: function (i, node) { return 1; },
            hLineColor: function (i, node) { return 'black'; },
            vLineColor: function (i, node) { return 'black'; },
            paddingLeft: function (i, node) { return 5; },
            paddingRight: function (i, node) { return 5; },
            paddingTop: function (i, node) { return 5; },
            paddingBottom: function (i, node) { return 5; },
          },
        },
        {
          text: [
            contract?.data?.isDateLateChecked &&
            `- Trong quá trình thanh toán cho phép trễ hạn tối đa ${contract?.data?.maxDateLate} (ngày)\n`,
            contract?.data?.autoAddVAT &&
            `- Thuế VAT được tính (${contract?.data?.vatPercentage}%)\n`
          ].filter(Boolean),
          margin: [0, 10, 0, 10],
          fontSize: 11,
        },
      ].filter(Boolean) : [];

      const docDefinition = {
        content: [
          { text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", style: "header" },
          { text: "Độc lập - Tự do - Hạnh phúc", style: "subheader" },
          { text: "---------oOo---------", style: "subheader" },
          { text: contract.data.title.toUpperCase(), style: "contractTitle" },
          {
            text: [
              { text: 'Số: ', style: "subheader" }, { text: contract.data.contractNumber }
            ],
            margin: [0, 10, 0, 15],
            fontSize: 11
          },
          ...(contract.data.legalBasisTerms?.length > 0
            ? [
              ...contract.data.legalBasisTerms.map((item, index) => ({
                text: [
                  { text: `- ${item.value}`, italics: true },
                ],
                margin: [0, 2, 0, 2],
                fontSize: 11,
              }))
            ]
            : []),
          {
            text: [
              { text: `Hôm nay, Hợp đồng dịch vụ này được lập vào ngày ${dayjs(parseDate(contract.data.signingDate)).format("DD")} tháng ${dayjs(parseDate(contract.data.signingDate)).format("MM")} năm ${dayjs(parseDate(contract.data.signingDate)).format("YYYY")}, tại ${contract.data.contractLocation}, bởi và giữa: ` }
            ],
            margin: [0, 7, 0, 3],
            fontSize: 11
          },
          { text: "BÊN CUNG CẤP (BÊN A)", style: "titleDescription", decoration: 'underline' },
          {
            text: [
              { text: 'Tên công ty: ', style: "boldtext" }, { text: contract.data.partnerA.partnerName }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: contract.data.partnerA.partnerAddress }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Người đại diện: ', style: "boldtext" }, { text: contract.data.partnerA.spokesmanName }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Chức vụ: ', style: "boldtext" }, { text: contract.data.partnerA.position }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Mã số thuế: ', style: "boldtext" }, { text: contract.data.partnerA.partnerTaxCode }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Email: ', style: "boldtext" }, { text: contract.data.partnerA.partnerEmail }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          { text: "BÊN SỬ DỤNG (BÊN B)", style: "titleDescription", decoration: 'underline' },
          {
            text: [
              { text: 'Tên công ty: ', style: "boldtext" }, { text: contract.data.partnerB.partnerName }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: contract.data.partnerB.partnerAddress }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Người đại diện: ', style: "boldtext" }, { text: contract.data.partnerB.spokesmanName }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Chức vụ: ', style: "boldtext" }, { text: contract.data.partnerB.position }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Mã số thuế: ', style: "boldtext" }, { text: contract.data.partnerB.partnerTaxCode }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: 'Email: ', style: "boldtext" }, { text: contract.data.partnerB.partnerEmail }
            ],
            margin: [0, 3, 0, 3],
            fontSize: 11
          },
          {
            text: [
              { text: `Sau khi bàn bạc và thống nhất, chúng tôi cùng thỏa thuận ký kết hợp đồng với nội dung và các điều khoản sau:` }
            ],
            margin: [0, 9, 0, 9],
            fontSize: 11
          },
          { text: "NỘI DUNG HỢP ĐỒNG", style: "titleDescription", decoration: 'underline' },
          {
            // thay vì text: parsedContent
            stack: lines.map(line => ({
              text: line,
              fontSize: 11,
              margin: [0, 2, 0, 2],   // tùy chỉnh khoảng cách dòng
            })),
            margin: [0, 7, 0, 0],
            lineHeight: 1.2,
          },
          ...paymentSection,
          {
            text: "THỜI GIAN HIỆU LỰC LIÊN QUAN",
            style: "titleDescription",
            decoration: 'underline',
            margin: [0, 10, 0, 10],
          },
          contract?.data?.effectiveDate && contract?.data?.expiryDate && {
            margin: [0, 5, 0, 5],
            fontSize: 11,
            text: [
              `- Ngày bắt đầu hiệu lực: ${dayjs(parseDate(contract?.data?.effectiveDate)).format('HH:mm')} ngày `,
              { text: dayjs(parseDate(contract.data.effectiveDate)).format('DD/MM/YYYY'), bold: true },
              `\n- Ngày chấm dứt hiệu lực: ${dayjs(parseDate(contract?.data?.expiryDate)).format('HH:mm')} ngày `,
              { text: dayjs(parseDate(contract.data.expiryDate)).format('DD/MM/YYYY'), bold: true },
            ],
          },
          ...[
            contract?.data?.autoRenew === true && {
              text: "- Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía",
              margin: [0, 5, 0, 5],
              fontSize: 11
            },
            contract?.data?.appendixEnabled === true && {
              text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
              margin: [0, 5, 0, 5],
              fontSize: 11
            }
          ].filter(Boolean),
          {
            text: "CÁC LOẠI ĐIỀU KHOẢN",
            style: "titleDescription",
            decoration: 'underline',
            margin: [0, 10, 0, 10],
          },
          {
            margin: [0, 5, 0, 5],
            columns: [
              {
                width: '*',
                stack: [
                  groupedTerms.Common.length > 0 && {
                    text: "Điều khoản chung",
                    style: "titleDescription",
                    margin: [5, 8],
                  },
                  ...(contract.data.generalTerms?.length > 0
                    ? [
                      ...contract.data.generalTerms.map((item, index) => ({
                        text: [
                          { text: `- ${item.value}` },
                        ],
                        margin: [5, 5],
                        fontSize: 11,
                      }))
                    ]
                    : []),
                  ...groupedTerms.Common.map((termId, index) => ({
                    text: `- ${termId}`,
                    margin: [5, 2],
                    fontSize: 11,
                  })),
                  groupedTerms.A.length > 0 && {
                    text: "Điều khoản riêng bên A",
                    style: "titleDescription",
                    margin: [5, 5],
                    // fontSize: 11,
                  },
                  ...groupedTerms.A.map((termId, index) => ({
                    text: `- ${termId}`,
                    margin: [5, 2],
                    fontSize: 11,
                  })),
                  contract?.data?.specialTermsA && contract?.data?.specialTermsA.trim() !== "" && {
                    text: `- ${contract?.data?.specialTermsA}`,
                    margin: [5, 2],
                    fontSize: 11,
                  },
                  groupedTerms.B.length > 0 && {
                    text: "Điều khoản riêng bên B",
                    style: "titleDescription",
                    margin: [5, 8],
                    // fontSize: 11,
                  },
                  ...groupedTerms.B.map((termId, index) => ({
                    text: `- ${termId}`,
                    margin: [5, 2],
                    fontSize: 11,
                  })),
                  contract?.data?.specialTermsB && contract?.data?.specialTermsB.trim() !== "" && {
                    text: `- ${contract?.data?.specialTermsB}`,
                    margin: [5, 2],
                  },
                  contract.data.otherTerms?.length > 0 && {
                    text: "Điều khoản khác",
                    style: "titleDescription",
                    margin: [5, 8],
                  },
                  ...(contract.data.otherTerms?.length > 0
                    ? [
                      ...contract.data.otherTerms.map((item, index) => ({
                        text: [
                          { text: `- ${item.value}` },
                        ],
                        margin: [5, 5],
                        fontSize: 11,
                      }))
                    ]
                    : []),
                ].filter(Boolean),
              },
            ],
          },
          (contract?.data?.appendixEnabled ||
            contract?.data?.transferEnabled ||
            contract?.data?.violate ||
            contract?.data?.suspend) ? [
            {
              text: "CÁC THÔNG TIN KHÁC",
              style: "titleDescription",
              decoration: 'underline',
              margin: [0, 10, 0, 10],
            },
            {
              stack: [
                contract?.data?.appendixEnabled && {
                  text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
                  margin: [0, 3, 0, 3],
                  fontSize: 11,
                },
                contract?.data?.transferEnabled && {
                  text: "- Cho phép chuyển nhượng hợp đồng",
                  margin: [0, 3, 0, 3],
                  fontSize: 11,
                },
                contract?.data?.violate && {
                  text: "- Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản",
                  margin: [0, 3, 0, 3],
                  fontSize: 11,
                },
                contract?.data?.suspend && {
                  text: `- Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: ${contract?.data?.suspendContent}`,
                  margin: [0, 3, 0, 3],
                  fontSize: 11,
                },
              ].filter(Boolean),
            },
          ] : [],
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: "ĐẠI DIỆN BÊN A", style: "signatureTitle" },
                  { text: contract.data.partnerA.partnerName.toUpperCase(), style: "signatureName", bold: true },
                  { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                ],
                alignment: 'center'
              },
              {
                width: '*',
                stack: [
                  { text: "ĐẠI DIỆN BÊN B", style: "signatureTitle" },
                  { text: contract.data.partnerB.partnerName.toUpperCase(), style: "signatureName", bold: true },
                  { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                ],
                alignment: 'center'
              }
            ],
            margin: [0, 30, 0, 0]
          },
        ],
        styles: {
          header: {
            fontSize: 15,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          subheader: {
            fontSize: 13,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          contractTitle: {
            fontSize: 19,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'black',
            fillColor: '#f0f0f0',
            margin: [5, 5, 5, 5],
          },
          tableCell: {
            fontSize: 11,
            margin: [7, 5, 5, 5],
          },
          boldtext: {
            bold: true,
            fontSize: 11,
          },
          titleDescription: {
            bold: true,
            fontSize: 14,
            margin: [0, 10, 0, 5],
          },
          signatureTitle: {
            fontSize: 11,
            bold: true,
            margin: [0, 0, 0, 5]
          },
          signatureName: {
            fontSize: 12,
            bold: true,
            margin: [0, 0, 0, 5]
          },
          signatureNote: {
            fontSize: 11,
            color: '#666666',
            fontStyle: 'italic'
          }
        },
        defaultStyle: {
          font: "Roboto",
        },
      };

      pdfMake.createPdf(docDefinition).download(`${contract?.data.title} (${contract?.data.contractNumber}).pdf`);
      onDone();
    }
  }, [isSuccess, contract]);

  return null;
};

export default ExportContractPDF;
