import Piece from './piece';

export default class Bishop extends Piece {
    constructor(player,initPos, hasMoved) {
        super(player, (player === 'white' ? "images/white-bishop.svg" : "images/black-bishop.svg"),initPos, hasMoved);
    }

    isMovePossible([destRow, destCol]) {
        let [sourceRow,sourceCol] = this.currentPos;
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);

        return (rowDiff > 0 && rowDiff === colDiff);
    }

    getPathToDest([destRow, destCol]) {
        let [sourceRow,sourceCol] = this.currentPos;
        let rowDiff = sourceRow - destRow;
        let colDiff = sourceCol - destCol;
        let path = [];
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
        return path;
    }

    getPossibleMoves() { //current position of the bishop
        const [row,col] = this.currentPos;
        let moves=[];
        for (let i=-7; i<=7; i++) {
            if (i!==0) {
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