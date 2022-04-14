import { useState, useEffect } from "react";
import styles from "../css/Board.module.css";
import { Square } from "../components/Square";
import * as SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const client = new Client();

export const Board = () => {
  const [gameStart, setGameStart] = useState(false);
  const [game, setGame] = useState({ squares: Array(9).fill("") });
  const [meId, setMeId] = useState("");
  const [username, setUsername] = useState("");
  const [showUsername, setShowUsername] = useState(true);
  const [showPlayerNames, setShowPlayerNames] = useState(false);
  const [showButtons, setShowButtons] = useState(true);

  useEffect(() => {
    client.webSocketFactory = () => {
      return new SockJS("http://localhost:8080/socket");
    };
    client.onConnect = () => {
      const create = client.subscribe("/user/queue/create", (message) => {
        const broadcast = client.subscribe(
          "/topic/broadcast/" + JSON.parse(message.body).gameId,
          (message) => {
            setGameStart(true);
            setShowPlayerNames(true);
            setGame(JSON.parse(message.body));
          }
        );
        const move = client.subscribe(
          "/topic/move/" + JSON.parse(message.body).gameId,
          (message) => {
            setGame(JSON.parse(message.body));
          }
        );

        setMeId(JSON.parse(message.body).firstPlayerID);
        setGame(JSON.parse(message.body));
      });
      const join = client.subscribe("/user/queue/random", (message) => {
        const broadcast = client.subscribe(
          "/topic/broadcast/" + JSON.parse(message.body).gameId,
          (message) => {
            setGameStart(true);
            setShowPlayerNames(true);
            setGame(JSON.parse(message.body));
          }
        );
        const move = client.subscribe(
          "/topic/move/" + JSON.parse(message.body).gameId,
          (message) => {
            setGame(JSON.parse(message.body));
          }
        );

        client.publish({
          destination: "/app/broadcast/" + JSON.parse(message.body).gameId,
          body: JSON.stringify({
            gameId: JSON.parse(message.body).gameId,
          }),
        });
        setMeId(JSON.parse(message.body).secondPlayerID);
        setGameStart(true);
        setGame(JSON.parse(message.body));
      });
    };
    client.activate();
  }, []);

  const handleClick = (value) => {
    if (!gameStart || game.currentPlayerID != meId || game.winner) {
      return;
    }
    client.publish({
      destination: "/app/move/" + game.gameId,
      body: JSON.stringify({
        squareIndex: value,
        gameId: game.gameId,
        currentPlayerID: game.currentPlayerID,
      }),
    });
  };

  const createGame = () => {
    setShowButtons(false);
    client.publish({
      destination: "/app/create",
      body: JSON.stringify({
        username: username,
      }),
    });
  };

  const connectToRandom = () => {
    setShowButtons(false);
    client.publish({
      destination: "/app/random",
      body: JSON.stringify({
        username: username,
      }),
    });
  };

  const createSquare = (i) => {
    return <Square value={game.squares[i]} onClick={() => handleClick(i)} />;
  };

  const winner = () => {
    if (game.winner && game.currentPlayerID === game.firstPlayerID) {
      return <p>Wygral gracz: O</p>;
    }
    if (game.winner && game.currentPlayerID === game.secondPlayerID) {
      return <p>Wygral gracz: X</p>;
    }
    return null;
  };

  const draw = () => {
    if (game.draw) {
      return <p>Remis</p>;
    }
    return null;
  };

  const playerTurn = () => {
    if (game.winner || game.draw) {
      return null;
    }
    if (game.xNext != null) {
      return (
        <p>
          Ruch gracza: {game.currentPlayerID === game.firstPlayerID ? "X" : "O"}
        </p>
      );
    }
    return null;
  };

  const usernameElement = () => {
    return (
      <div className={styles.inputContainer}>
        <label htmlFor="username">Twoj nick:</label>
        <input
          type="text"
          value={username}
          id="username"
          onChange={(e) => handleUsername(e)}
          autoComplete="off"
        />
        <button onClick={() => setShowUsername(false)}>Potwierdz nick</button>
      </div>
    );
  };

  const handleUsername = (e) => {
    setUsername(e.target.value);
  };

  const playerNames = () => {
    return (
      <p>
        {game.firstPlayerName} vs {game.secondPlayerName}
      </p>
    );
  };

  const createJoinButtons = () => {
    return (
      <>
        <button onClick={() => createGame()}>Stworz gre</button>
        <button onClick={() => connectToRandom()}>Dolacz do losowej gry</button>
      </>
    );
  };

  return (
    <div className={styles.board}>
      {playerTurn()}
      {winner()}
      {draw()}
      {showUsername ? usernameElement() : null}
      {showPlayerNames ? playerNames() : null}
      {showButtons ? createJoinButtons() : null}
      <div className={styles.row}>
        {createSquare(0)}
        {createSquare(1)}
        {createSquare(2)}
      </div>
      <div className={styles.row}>
        {createSquare(3)}
        {createSquare(4)}
        {createSquare(5)}
      </div>
      <div className={styles.row}>
        {createSquare(6)}
        {createSquare(7)}
        {createSquare(8)}
      </div>
    </div>
  );
};
