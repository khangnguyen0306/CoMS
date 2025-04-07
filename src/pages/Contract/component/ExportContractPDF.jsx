import { useEffect } from "react";
import dayjs from "dayjs";
import { useLazyGetContractDetailQuery } from "../../../services/ContractAPI";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts"; 

pdfMake.vfs = pdfFonts.vfs; 


const ExportContractPDF = ({ contractId, onDone }) => {
  const [getContractDetail, { data: contract, isSuccess }] = useLazyGetContractDetailQuery();

  useEffect(() => {
    if (contractId) {
      getContractDetail(contractId);
    }
  }, [contractId]);

  useEffect(() => {
    if (isSuccess && contract) {
      const docDefinition = {
        content: [
          { text: "THÔNG TIN HỢP ĐỒNG", style: "header" },
          {
            style: "table",
            table: {
              widths: ["auto", "*"],
              body: [
                ["Số hợp đồng", contract.contractNumber || "-"],
                ["Tên hợp đồng", contract.name || "-"],
                ["Trạng thái", contract.status || "-"],
                ["Ngày bắt đầu", dayjs(contract.startDate).format("DD/MM/YYYY")],
                ["Ngày kết thúc", dayjs(contract.endDate).format("DD/MM/YYYY")],
                ["Bên A", contract.partyA?.name || "-"],
                ["Bên B", contract.partyB?.name || "-"],
              ],
            },
            layout: "lightHorizontalLines",
          },
          contract.description && {
            text: [
              { text: "\nMô tả:\n", bold: true },
              contract.description,
            ],
            margin: [0, 10, 0, 0],
          },
        ],
        styles: {
          header: {
            fontSize: 16,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10],
          },
          table: {
            margin: [0, 10, 0, 10],
          },
        },
        defaultStyle: {
          font: "Roboto", // Font mặc định hỗ trợ tiếng Việt
        },
      };

      pdfMake.createPdf(docDefinition).download(`HopDong_${contract.contractNumber || contractId}.pdf`);

      onDone();
    }
  }, [isSuccess, contract]);

  return null;
};

export default ExportContractPDF;
