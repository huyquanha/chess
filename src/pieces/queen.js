import Piece from './piece';

export default class Queen extends Piece {
    constructor(player,initPos) {
        super(player, (player === 'white' ? "images/white-queen.svg" : "images/black-queen.svg"),initPos);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0) || (rowDiff > 0 && colDiff === rowDiff);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = sourceRow - destRow;
        let colDiff = sourceCol - destCol;
        let path = [];
        if (rowDiff === 0) { //move horizontally
            if (colDiff > 0) {
                for (let i = sourceCol - 1; i > destCol; i--) {
                    path.push([sourceRow, i]);
                }
            } else {
                for (let i = sourceCol + 1; i < destCol; i++) {
                    path.push([sourceRow, i]);
                }
            }
        } else if (colDiff === 0) { //move vertically
            if (rowDiff > 0) {
                for (let i = sourceRow - 1; i > destRow; i--) {
                    path.push([i, sourceCol]);
                }
            } else {
                for (let i = sourceRow + 1; i < destRow; i++) {
                    path.push([i, sourceCol]);
                }
            }
        } else { //move diagonally => abs(colDiff)===abs(rowDiff)
            if (rowDiff > 0 && colDiff > 0) {
                for (let i = 1; i < rowDiff; i++) {
                    path.push([sourceRow - i, sourceCol - i]);
                }
            } else if (rowDiff < 0 && colDiff < 0) {
                for (let i = 1; i < Math.abs(rowDiff); i++) {
                    path.push([sourceRow + i, sourceCol + i]);
                }
            } else if (rowDiff > 0 && colDiff < 0) {
                for (let i = 1; i < rowDiff; i++) {
                    path.push([sourceRow - i, sourceCol + i]);
                }
            } else {
                for (let i = 1; i < colDiff; i++) {
                    path.push([sourceRow + i, sourceCol - i]);
                }
            }
        }
        return path;
    }

    getPossibleMoves() { //current position of the queen
        const [row,col] = this.getCurrentPos();
        let moves=[];
        for (let i=-7; i<=7; i++) {
            if (i!==0) {
                if (this.inBoard(row+i,col)) {
                    //vertical moves
                    moves.push([row+i,col]);
                }
                if (this.inBoard(row,col+i)) {
                    //horizontal moves
                    moves.push([row,col+i]);
                }
                if (this.inBoard(row+i,col+i)) {
                    //diagonal moves, row and col both increase/decrease
                    moves.push([row+i,col+i]);
                }
                if (this.inBoard(row+i,col-i)) {
                    //diagonal moves, row and col one increase the other decrease
                    moves.push([row+i,col-i]);
                }
            }
        }
        return moves;
    }
}