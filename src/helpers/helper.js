import King from '../pieces/king';
import Queen from '../pieces/queen';
import Bishop from '../pieces/bishop';
import Knight from '../pieces/knight';
import Rook from '../pieces/rook';
import Pawn from '../pieces/pawn';

export default function initChessBoard() {
    let board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let i = 0; i < 8; i++) {
        board[1][i] = new Pawn('black'); //top of the board is black
        board[6][i] = new Pawn('white'); //bottom of the board is white
        switch (i) {
            case 0:
            case 7:
                board[0][i] = new Rook('black');
                board[7][i] = new Rook('white');
                break;
            case 1:
            case 6:
                board[0][i] = new Knight('black');
                board[7][i] = new Knight('white');
                break;
            case 2:
            case 5:
                board[0][i] = new Bishop('black');
                board[7][i] = new Bishop('white');
                break;
            case 3:
                board[0][i] = new Queen('black');
                board[7][i] = new Queen('white');
                break;
            case 4:
                board[0][i] = new King('black');
                board[7][i] = new King('white');
                break;
            default:
                break;
        }
    }
    return board;
}