const port = "8080";
const baseURL = `http://localhost:${port}`;

export const endpoints = {
  createGame: baseURL + "/create",
  connectToRandom: baseURL + "/connect/random",
  connectToGame: baseURL + "/connect",
};
