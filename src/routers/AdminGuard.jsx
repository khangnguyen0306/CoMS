import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { selectCurrentToken, selectCurrentUser } from "../slices/auth.slice";


const AdminGuard = () => {
    const token = useSelector(selectCurrentToken);
    const user = useSelector(selectCurrentUser);
    console.log(user)
    if (!token || user.roles[0] !== "ROLE_ADMIN") {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;

};

export default AdminGuard;
