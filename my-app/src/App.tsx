import * as React from "react";
import { useEffect } from "react";
import ImagesCollection from "./resources/ImagesCollection";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./website/pages/Home";
import SignIn from "./website/pages/SignIn";
import SignUp from "./website/pages/SignUp";
import AuthenticationService from "./website/services/AuthenticationService";
import Lobbies from "./website/pages/Lobbies";
import { WebSocketService } from "./website/services/WebsocketService";
import { LobbiesService } from "./website/services/LobbiesService";

export interface IAppProps {}

export default function App(props: IAppProps) {
  useEffect(() => {
    // Doesn't matter of order
    ImagesCollection.init();
    WebSocketService.Init();
    LobbiesService.Init();

    // Also include refreshing token on local storage so should be call last
    AuthenticationService.Init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="/sign-in" element={<SignIn />}/>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/lobbies" element={<Lobbies/> } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
