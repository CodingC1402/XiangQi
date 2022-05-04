import * as React from "react";
import { LobbyDto } from "../dto/LobbyDto";
import { LobbiesService } from "../services/LobbiesService";
import "./Lobbies.css";

export interface ILobbiesProps {}

export default function Lobbies(props: ILobbiesProps) {
  const [lobbies, setLobbies] = React.useState<LobbyDto[]>([]);

  // Store it for cleaning up
  let updateLobbies = (lobbies: LobbyDto[]) => {
    setLobbies([...lobbies]);
  }

  // Add and remove listener on mount and dismount
  React.useEffect(() => {
    LobbiesService.onLobbiesUpdated.addCallback(updateLobbies);
    updateLobbies(LobbiesService.lobbies);

    return () => {
      LobbiesService.onLobbiesUpdated.removeCallback(updateLobbies);
    }
  }, []);

  let rows = CreateLobbiesElements(lobbies);

  return (
    <div className="container h-100">
      <div className="row h-100">
        <div key={"lobbiesInfo"} className="col-lg-7 bg-primary h-100"></div>
        <div
          key={"lobbiesList"}
          className="lobbiesListDiv col-lg-5 d-flex justify-content-center"
        >
          <div className="align-self-center py-3">
            <div key={"table-header"} className="fw-bold fs-3 text-center mb-3 top-0">List of lobbies</div>
            <div key={"table"} className="card card-body">
              <table className="table mt-2 table-striped">
                <thead className="text-bold position-sticky top-0 h-100">
                  <tr>
                    <th key={"head-1"} scope="col" className="col-1">
                      #
                    </th>
                    <th key={"head-2"} scope="col" className="col-4">
                      Player1
                    </th>
                    <th key={"head-3"} scope="col" className="col-6">
                      Options
                    </th>
                  </tr>
                </thead>
              </table>
              <table className="lobbiesTable table table-stripe">
                <tbody>{rows}</tbody>
              </table>
            </div>
            <button key={"create-lobby"} className="btn btn-primary w-100 mb-2 mt-4 fw-bold" onClick={CreateNewLobby}>
              Create new lobby
            </button>
            <button key={"join-lobby"} className="btn btn-primary w-100 fw-bold">
              Join with id
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateNewLobby() {
  LobbiesService.CreateLobby();
}

function JoinLobbyWithId(id: String) {

}

function CreateLobbiesElements(lobbies: LobbyDto[]) {
  let rows = [];

  for (let i = 0; i < lobbies.length; i++) {
    let lobby = lobbies[i]

    rows.push(
      <tr key={i}>
        <th className="col-1" scope="row">
          {i + 1}
        </th>
        <td className="col-4">{lobby.player1}</td>
        <td className="col-6">
          <button className="btn btn-primary me-3 fw-bold" onClick={() => JoinLobbyWithId(lobby.id)}>Join</button>
          <button className="btn btn-info  fw-bold">Info</button>
        </td>
      </tr>
    );
  }

  return rows;
}