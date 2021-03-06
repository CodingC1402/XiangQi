import * as React from "react";
import { NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import "./SignUp.css";
import background from "../../resources/backgrounds/chessBackground.bmp";
import { SearchParam } from "../configurations/searchParam";
import SignUpForm, { SignUpInfo } from "../components/SignUpForm";
import AuthenticationService from "../services/AuthenticationService";

export interface ISignUpProps {}

export default function SignUp(props: ISignUpProps) {
  const location = useLocation();
  const [error, setError] = React.useState("");
  const [successful, setSuccessful] = React.useState(false);
  const navigate = useNavigate();

  let info: SignUpInfo;

  React.useEffect(() => {
    const searchParam = new SearchParam(location.search);
    setSuccessful(searchParam.successful);
  }, [location]);

  return (
    <div
      className="d-flex background-wrapper align-content-center h-100"
      style={{ backgroundImage: `url(${background})`, backgroundSize: "cover" }}
    >
      <div className="form-wrapper row w-100 justify-content-center">
        {successful ? (
          <form className="signUpForm ms-4 col-xl-6 col-lg-8 col-10 align-self-center">
            <div className="card card-body rounded-3 shadow fw-bold text-center fs-4">
              Register successfully :D
              <div className="mt-4">
                <button type="button" className="btn btn-primary fw-bold" onClick={() => navigate("/sign-in")}> Sign in </button>
              </div>
            </div>
          </form>
        ) : (
          <SignUpForm
            text={error}
            isError={error ? true : false}
            tittle={"Sign up"}
            buttonText="Sign up"
            linkText="Already have an account?"
            isSignIn={false}
            linkUrl={"/sign-in"}
            onRender={(c) => (info = c)}
            onSubmit={() => register(info, navigate, (msg) => {
              setError(msg);
            })}
          />
        )}
      </div>
    </div>
  );
}

function register(info: SignUpInfo, nav: NavigateFunction, errClb: (message: string) => void) {
  if (info.password !== info.passwordConfirm) {
    errClb("Password and confirm password has to be the same!");
    return;
  }

  AuthenticationService.Register(info.username, info.email, info.password, (err) => {
    if (err) {
      errClb(err.response!.data.message);
      return;
    }

    let searchParam: SearchParam = new SearchParam();
    searchParam.successful = true;

    nav("/sign-up?" + searchParam.toString());
  })
}