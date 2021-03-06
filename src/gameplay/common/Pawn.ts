import { generateMoveFunc, Piece } from "./Piece";

// Without checking complex king checkmate
export var generateMovePawn: generateMoveFunc = (board: string, x: number, y: number, isRed: boolean) => {
  let result = "";
  let crossedTheRiver = (isRed && y < 5) || (!isRed && y > 4);

  if (crossedTheRiver) {
    result += Piece.generatePos(board, x + 1, y, isRed);
    result += Piece.generatePos(board, x - 1, y, isRed);
  }

  if (isRed) {
    result += Piece.generatePos(board, x, y - 1, isRed);
  }
  else {
    result += Piece.generatePos(board, x, y + 1, isRed);
  }

  return result;
}