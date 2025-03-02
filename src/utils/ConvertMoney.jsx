
export const numberToVietnamese = (num) => {
    const ChuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const DonVi = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    
    if (num === 0) return "không đồng";
    
    let result = "";
    let i = 0;
    
    while (num > 0) {
      let block = num % 1000;
      if (block > 0) {
        let blockStr = "";
        const tram = Math.floor(block / 100);
        const chuc = Math.floor((block % 100) / 10);
        const donvi = block % 10;
        
        if (tram > 0) {
          blockStr += ChuSo[tram] + " trăm ";
          if (chuc === 0 && donvi > 0) blockStr += "lẻ ";
        }
        
        if (chuc > 1) {
          blockStr += ChuSo[chuc] + " mươi ";
          if (donvi === 1) blockStr += "mốt ";
          else if (donvi > 0) blockStr += ChuSo[donvi] + " ";
        } else if (chuc === 1) {
          blockStr += "mười ";
          if (donvi > 0) blockStr += ChuSo[donvi] + " ";
        } else if (donvi > 0) {
          blockStr += ChuSo[donvi] + " ";
        }
  
        result = blockStr + DonVi[i] + " " + result;
      }
      num = Math.floor(num / 1000);
      i++;
    }
    
    return result.trim() + " đồng";
  };