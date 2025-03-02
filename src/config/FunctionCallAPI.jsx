import React from 'react'
import { useLazyGetClauseManageQuery, useLazyGetLegalQuery } from '../services/ClauseAPI';

const FunctionCallAPI = () => {
    const [getContractLegal, { data: legalData, isLoading: loadingLegal }] = useLazyGetLegalQuery();
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery({ typeTermIds: 9 });
    const loadGenaralData = async ({ page, size, keyword }) => {

        return getGeneralTerms({ page, size, keyword, typeTermIds: 9 }).unwrap();
    };
     const loadDKBSData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 1 }).unwrap();
    };
     const loadQVNVCBData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 2 }).unwrap();
    };
     const loadBHVBTData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 3 }).unwrap();
    };
     const loadVPBTTHData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 4 }).unwrap();
    };
     const loadCDHDData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 5 }).unwrap();
    };
     const loadGQTCData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 6 }).unwrap();
    };
     const loadBMData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 7 }).unwrap();
    };
     const loadDKKata = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    };
   
  return (
    <div>FunctionCallAPI</div>
  )
}

export default FunctionCallAPI