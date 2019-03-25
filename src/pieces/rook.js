import Piece from './piece';

export default class Rook extends Piece {
    constructor(player,initPos) {
        super(player, (player === 'white' ? "images/white-rook.svg" : "images/black-rook.svg"),initPos);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);

        return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0);
    }

    getPathToDest([destRow, destCol]) {
        let [sourceRow,sourceCol] = this.getCurrentPos();
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
        } else { //move vertically
            if (rowDiff > 0) {
                for (let i = sourceRow - 1; i > destRow; i--) {
                    path.push([i, sourceCol]);
                }
            } else {
                for (let i = sourceRow + 1; i < destRow; i++) {
                    path.push([i, sourceCol]);
                }
            }
        }
        return path;
    }

    getPossibleMoves() { //current position of the rook
        const [row,col] = this.getCurrentPos();
        let moves = [];
        for (let i = -7; i <= 7; i++) {
            if (i !== 0) {
                if (this.inBoard(row + i, col)) {
                    //vertical moves
                    moves.push([row + i, col]);
                }
                if (this.inBoard(row, col + i)) {
                    //horizontal moves
                    moves.push([row, col + i]);
                }
            }
        }
        return moves;
    }
}