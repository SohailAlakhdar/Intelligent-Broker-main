import React from "react";
import ApproveEstateReq from "../components/approveEstateReq";
import UsersReport from "../components/usersReport";
import { MyContext } from "../components/provider";
import { CheckAuth } from "../components/checkData";
import { useNavigate } from "react-router-dom";
import * as serverUserFunctions from "../serverFunctions/user";
import EstateReports from "../components/estateReports";
function AdminDashBoard() {
  const navigate = useNavigate();
  const CheckAdminAuth = async () => {
    if (CheckAuth()) {
      let res = await serverUserFunctions.checkAdmin();

      if (res.isAdmin === true) return;
    }
    return navigate("/");
  };
  React.useEffect(() => {
    CheckAdminAuth();
  }, [navigate]);

  return (
    <MyContext.Consumer>
      {(context) => {
        return (
          <div>
            <ApproveEstateReq
              estateRequests={context.estateRequests}
              setEstateRequests={context.setEstateRequests}
            />
            <EstateReports />
            <UsersReport />
          </div>
        );
      }}
    </MyContext.Consumer>
  );
}
export default AdminDashBoard;
