import Piece from './piece';

export default class King extends Piece {
    constructor(player,initPos) {
        super(player, (player === 'white' ? "images/white-king.svg" : "images/black-king.svg"),initPos);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff === 0 && colDiff === 1)
            || (rowDiff === 1 && colDiff === 0)
            || (rowDiff === 1 && colDiff === 1)
            || (!this.hasMoved() && rowDiff===0 && colDiff===2);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) { //only move 1 step => no node in between
        let colDiff = Math.abs(sourceCol - destCol);
        if (colDiff<2) {
            return [];
        }
        else {
            return [[sourceRow,(sourceCol+destCol)/2]];
        }

    }

    getPossibleMoves() { //current position of the king
        const [row,col] = this.getCurrentPos();
        let moves=[];
        for (let rowOffset = -1; rowOffset <=1; rowOffset++) {
            for (let colOffset = -1; colOffset <=1; colOffset++) {
                if (!(row+rowOffset === row && col+colOffset===col)
                    && this.inBoard(row+rowOffset,col+colOffset)) {
                    moves.push([row+rowOffset,col+colOffset]);
                }
            }
        }
        return moves;
    }
}