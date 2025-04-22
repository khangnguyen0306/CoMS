// MaintenancePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './errorPage.css'
import { Button } from 'antd';
const MaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div class="error-page flex justify-center items-center w-full  min-h-[100vh]">
      <section class="page_404">
        <div class="container">
          <div class="row">
            <div class="col-sm-12 ">
              <div class="col-sm-10 col-sm-offset-1  text-center">
                <div class="four_zero_four_bg">
                  <h1 class="text-center text-red-700 mt-[100px] font-bold">404</h1>
                </div>
                <div class="contant_box_404">
                  <h3 class="text-lg font-bold mb-4">
                   Bạn đi lạc rồi !!!!!!
                  </h3>

                  <p>Trang bạn đang đến hiện tại không tìm thấy !</p>

                  <Button
                    onClick={() => navigate('/')}
                    size='large'
                    className="
                                         w-[100%]
                                        bg-gradient-to-r 
                                        from-blue-500 to-cyan-400 text-white 
                                        font-medium rounded-full py-2 px-6 transition-transform duration-800
                                        hover:from-cyan-400 hover:to-blue-500 hover:scale-105 hover:shadow-cyan-200 hover:shadow-lg
                                        mt-10
                                        "
                    type="primary"
                  >
                    Trở về trang chủ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MaintenancePage;
