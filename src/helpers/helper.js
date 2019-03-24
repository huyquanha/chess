import King from '../pieces/king';
import Queen from '../pieces/queen';
import Bishop from '../pieces/bishop';
import Knight from '../pieces/knight';
import Rook from '../pieces/rook';
import Pawn from '../pieces/pawn';

export default function initChessBoard() {
    let board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let i = 0; i < 8; i++) {
        board[1][i] = new Pawn('black',[1,i]); //top of the board is black
        board[6][i] = new Pawn('white',[6,i]); //bottom of the board is white
        switch (i) {
            case 0:
            case 7:
                board[0][i] = new Rook('black',[0,i]);
                board[7][i] = new Rook('white',[7,i]);
                break;
            case 1:
            case 6:
                board[0][i] = new Knight('black',[0,i]);
                board[7][i] = new Knight('white',[7,i]);
                break;
            case 2:
            case 5:
                board[0][i] = new Bishop('black',[0,i]);
                board[7][i] = new Bishop('white',[7,i]);
                break;
            case 3:
                board[0][i] = new Queen('black',[0,i]);
                board[7][i] = new Queen('white',[7,i]);
                break;
            case 4:
                board[0][i] = new King('black',[0,i]);
                board[7][i] = new King('white',[7,i]);
                break;
            default:
                break;
        }
    }
    return board;
}