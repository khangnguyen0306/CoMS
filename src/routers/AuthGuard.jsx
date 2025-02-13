import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectCurrentToken, selectCurrentUser } from "../slices/Auth.slice";

const AuthGuard = () => {
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  return <Outlet />;
};

export default AuthGuard;
