import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectCurrentToken, selectCurrentUser } from "../slices/authSlice";


const DirectorGuard = () => {
    const token = useSelector(selectCurrentToken);
    const user = useSelector(selectCurrentUser);
    // console.log(user)
    if (!token || user.roles[0] !== "ROLE_DIRECTOR") {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;

};

export default DirectorGuard;
