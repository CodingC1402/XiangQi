import { StompSubscription } from "@stomp/stompjs";
import urlJoin from "url-join";
import EventHandler from "../../utils/EventHandler";
import { Log } from "../../utils/Log";
import { AppAxios } from "../configurations/axiosConfig";
import { LobbyDto } from "../dto/LobbyDto";
import { LobbyMessage, LobbyMessageType, LobbyMessageUndoType } from "../dto/LobbyMessage";
import { LobbySetting } from "../dto/LobbySetting";
import PlayerDto from "../dto/PlayerDto";
import ResponseObject from "../dto/ResponseObject";
import AuthenticationService from "./AuthenticationService";
import {
  LOBBIES_URL,
  LOBBIES_WS_LOBBIES_BROKER,
  LOBBIES_WS_LOBBY_MESSAGE,
} from "./LobbiesService";
import { PlayerService } from "./PlayerService";
import { WebSocketService } from "./WebsocketService";

export interface LobbyInfo {
  lobbyID: string;

  player1: string;
  player2: string;

  player1Ready: boolean;
  player2Ready: boolean;

  board: string;

  isPlaying: boolean;

  setting: LobbySetting;
}

export class LobbyService {
  //#region members
  private static _lobbySubscription: StompSubscription;

  private static _lobbyID = "";
  public static get lobbyID() {
    return this._lobbyID;
  }

  private static _player1 = "";
  public static get player1() {
    return LobbyService._player1;
  }
  private static _player2 = "";
  public static get player2() {
    return LobbyService._player2;
  }

  private static _player1Ready = false;
  public static get player1Ready() {
    return LobbyService._player1Ready;
  }
  private static _player2Ready = false;
  public static get player2Ready() {
    return LobbyService._player2Ready;
  }

  private static _isPlayer1Red = true;
  public static get isPlayer1Red() {
    return LobbyService._isPlayer1Red;
  }

  // Check if the client is a red or black
  public static get isPlayerRed() {
    return (this.player1 === AuthenticationService.playerInfo!.username && this._isPlayer1Red) 
    || (this.player2 === AuthenticationService.playerInfo!.username && !this._isPlayer1Red);
  }

  private static _message: string[] = [];
  public static get message(): string[] {
    return LobbyService._message;
  }

  private static _board: string = "";
  public static get board(): string {
    return LobbyService._board;
  }

  private static _isPlaying: boolean = false;
  public static get isPlaying(): boolean {
    return LobbyService._isPlaying;
  }

  private static _finished: boolean = false;
  public static get finished(): boolean {
    return LobbyService._finished;
  }

  private static _setting: LobbySetting = {
    minPerTurn: 5,
    totalMin: 20,
    vsBot: false,
    privateLobby: false
  };
  public static get setting(): LobbySetting {
    return LobbyService._setting;
  }
 
  public static get lobbyInfo(): LobbyInfo {
    return {
      lobbyID: this.lobbyID,

      player1: this.player1,
      player2: this.player2,

      player1Ready: this.player1Ready,
      player2Ready: this.player2Ready,

      board: this.board,
      isPlaying: this.isPlaying,
      
      setting: this.setting,
    };
  }
  //#endregion
  //#region events
  public static readonly onLobbyUndoRequestReceive = new EventHandler<LobbyMessage>();
  public static readonly onLobbyUndoReplyReceive = new EventHandler<LobbyMessage>();
  public static readonly onLobbyUndo = new EventHandler<LobbyMessage>();
  public static readonly onLobbyInfoChanged = new EventHandler<LobbyMessageType>();
  public static readonly onLobbyMoveReceive = new EventHandler<LobbyMessage>();
  public static readonly onLobbyEndReceive = new EventHandler<LobbyMessage>();
  public static readonly onRestart = new EventHandler<LobbyMessage>();
  public static readonly onRequestPlayAgain = new EventHandler<LobbyMessage>();
  public static readonly onLobbyPlayerChanged = new EventHandler<(PlayerDto | undefined)[]>();
  //#endregion

  public static Ready(): void {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.CHANGE_READY,
    };

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message),
    });
  }

  public static Move(moveStr: string) {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.MOVE,
      data: moveStr,
    }
    
    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }

  public static Quit() {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.DISCONNECT,
      data: "",
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })

    this.UnsubscribeToLobby();
    this.cleanUpGame();
  }

  public static Concede() {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.END,
      data: "",
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }

  public static RequestUndo() {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.UNDO_REQUEST,
      data: "",
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }
  public static ReplyUndo(accept: boolean) {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.UNDO_REPLY,
      data: accept ? LobbyMessageUndoType.ACCEPTED : LobbyMessageUndoType.REFUSED,
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }

  public static PlayAgain() {
    if (typeof this.player1 === typeof undefined || typeof this.player2 === typeof undefined) {
      return;
    }

    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.PLAY_AGAIN,
      data: "",
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }

  public static Join(
    lobbyID: string,
    callback?: (err?: Error, lobby?: LobbyDto) => void
  ) {
    AppAxios.put(`${LOBBIES_URL}?id=${lobbyID}`)
      .then((res) => {
        let resObj: ResponseObject<LobbyDto> = res.data;
        this.SubscribeToLobby(resObj.data);

        if (callback) callback(undefined, resObj.data);
        this.invokePlayerChange();
      })
      .catch((err) => {
        if (callback) callback(err, undefined);
      });
  }

  public static ChangeSetting(setting: string) {
    let message: LobbyMessage = {
      player: AuthenticationService.playerInfo!.username,
      type: LobbyMessageType.CHANGE_SETTING,
      data: setting,
    }

    WebSocketService.stompClient!.publish({
      destination: urlJoin(LOBBIES_WS_LOBBY_MESSAGE, this.lobbyInfo.lobbyID),
      body: JSON.stringify(message)
    })
  }
  
  //Subscribe to lobby with id
  public static SubscribeToLobby(lobby: LobbyDto) {
    // Make sure to update the lobby info;
    this.SetInfo(lobby);
    this.UnsubscribeToLobby();

    this.onLobbyInfoChanged.invoke(LobbyMessageType.JOIN);
    WebSocketService.onReply.addCallback(this.OnServerReply);

    this._lobbySubscription = WebSocketService.stompClient!.subscribe(
      urlJoin(LOBBIES_WS_LOBBIES_BROKER, lobby.id),
      (message) => {
        let lobbyMessage: LobbyMessage = JSON.parse(message.body);
        let updateLobbyInfo = true;
        if (lobbyMessage.lobby) this.SetInfo(lobbyMessage.lobby);

        switch (lobbyMessage.type) {
          case LobbyMessageType.CHANGE_READY:
          case LobbyMessageType.CHANGE_SETTING: //New
          case LobbyMessageType.DISCONNECT:
          case LobbyMessageType.JOIN:
            if (!lobbyMessage.lobby) updateLobbyInfo = false;
            break;
          case LobbyMessageType.MOVE:
            if (lobbyMessage.player !==  AuthenticationService.playerInfo!.username) {
              this.onLobbyMoveReceive.invoke(lobbyMessage);
            }
            updateLobbyInfo = false;
            break;
          case LobbyMessageType.START:
            this._isPlaying = true;
            this._finished = false;
            break;
          case LobbyMessageType.END:
            this.onLobbyEndReceive.invoke(lobbyMessage);
            this._finished = true;
            break;
          case LobbyMessageType.UNDO:
            this.onLobbyUndo.invoke(lobbyMessage);
            break;
          case LobbyMessageType.UNDO_REQUEST:
            if (lobbyMessage.player !==  AuthenticationService.playerInfo!.username) {
              this.onLobbyUndoRequestReceive.invoke(lobbyMessage);
            }
            break;
          case LobbyMessageType.UNDO_REPLY:
            this.onLobbyUndoReplyReceive.invoke(lobbyMessage);
            break;
          case LobbyMessageType.PLAY_AGAIN:
            if (lobbyMessage.player !== AuthenticationService.playerInfo!.username) {
              this.onRequestPlayAgain.invoke(lobbyMessage);
            }
            break;
          case LobbyMessageType.RESTART:
            this._isPlaying = true;
            this.onRestart.invoke(lobbyMessage);
            break;
          default:
            updateLobbyInfo = false;
            break;
        }
        if (updateLobbyInfo) {
          this.onLobbyInfoChanged.invoke(lobbyMessage.type);
          this.invokePlayerChange();
        }
      }
    );
  }

  public static UnsubscribeToLobby() {
    if (this._lobbySubscription) this._lobbySubscription.unsubscribe();
    WebSocketService.onReply.removeCallback(this.OnServerReply);
  }

  private static SetInfo(lobby: LobbyDto) {
    this._lobbyID = lobby.id;

    this._player1 = lobby.player1;
    this._player2 = lobby.player2;

    this._player1Ready = lobby.player1Ready;
    this._player2Ready = lobby.player2Ready;

    this._isPlayer1Red = lobby.player1 === lobby.redPlayer;

    this._board = lobby.board;

    this._setting = lobby.setting;
  }

  private static OnServerReply = (response: ResponseObject<any>) => {
    if (response.status >= 300) {
      Log.error("WS_ERROR", JSON.stringify(response, null, 2))
    }
    else {
      Log.log("WS_LOG", JSON.stringify(response, null, 2));
    }
  }

  public static invokePlayerChange() {
    let player1Dto: PlayerDto | undefined, player2Dto;
    PlayerService.GetPlayer(this._player1, (result) => {
      player1Dto = result;
      PlayerService.GetPlayer(this._player2, (result) => {
        player2Dto = result;
        this.onLobbyPlayerChanged.invoke([player1Dto, player2Dto]);
      })
    });
  }

  private static cleanUpGame() {
    this.SetInfo({
      id: "",
      player1: "",
      player2: "",
      player1Ready: false,
      player2Ready: false,
      blackPlayer: "",
      redPlayer: "",
      board: "",
      setting: {} as LobbySetting,
    });

    this._isPlaying = false;
    this._finished = false;
  }
}
