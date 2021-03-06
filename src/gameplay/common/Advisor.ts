import { generateMoveFunc, Piece } from "./Piece";

// Without checking complex king checkmate
export var generateMoveAdvisor: generateMoveFunc = (board: string, x: number, y: number, isRed: boolean) => {
  let result = "";

  if ((!isRed || y - 1 > 6) && x - 1 > 2) result += Piece.generatePos(board, x - 1, y - 1, isRed);
  if ((!isRed || y - 1 > 6) && x + 1 < 6) result += Piece.generatePos(board, x + 1, y - 1, isRed);
  if ((isRed  || y + 1 < 3) && x - 1 > 2) result += Piece.generatePos(board, x - 1, y + 1, isRed);
  if ((isRed  || y + 1 < 3) && x + 1 < 6) result += Piece.generatePos(board, x + 1, y + 1, isRed);

  return result;
}