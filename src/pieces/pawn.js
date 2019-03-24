import Piece from './piece';

export default class Pawn extends Piece {
    constructor(player,initPos) {
        super(player, (player === 'white' ? "images/white-pawn.svg" : "images/black-pawn.svg"),initPos);
        this.initialPos = {
            blackSourceRow: 1, //top of the board
            whiteSourceRow: 6, //bottom of the board
        }
    }

    isInitialPosition(sourceRow) {
        return (this.player === 'white' && sourceRow === this.initialPos.whiteSourceRow) ||
            (this.player === 'black' && sourceRow === this.initialPos.blackSourceRow);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol], isDestEnemyOccupied) {
        let colDiff = Math.abs(sourceCol - destCol);
        let rowDiff = this.player === 'white' ? sourceRow - destRow : destRow - sourceRow;

        if (isDestEnemyOccupied) {
            if (rowDiff===1 && colDiff===1) {
                return true;
            }
            return false;
        }
        else if (this.isInitialPosition(sourceRow)) {
            return colDiff === 0 && [1, 2].includes(rowDiff);
        } else {
            return colDiff === 0 && rowDiff === 1;
        }
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) { //can move 1 or 2 step. If move 2 step, there's a square in between src and dest
        let rowDiff = this.player === 'white' ? sourceRow - destRow : destRow - sourceRow;
        if (rowDiff === 2) {
            return [[(sourceRow + destRow) / 2, sourceCol]];
        } else {
            return [];
        }
    }

    //this method is to get the moves where a pawn can eat other pieces, not the moves the pawn can go
    //for other pieces, the move they can eat and the move they go are the same, but not for pawn
    getPossibleMoves() {
        const [row,col] = this.getCurrentPos();
        let moves=[];
        if (this.player ==='white') { //pawn can eat up, or the row should decrease
            if (this.inBoard(row-1,col-1)) {
                moves.push([row-1,col-1]);
            }
            if (this.inBoard(row-1,col+1)) {
                moves.push([row-1,col+1]);
            }
        }
        else { //pawn eat down, or the row increase
            if (this.inBoard(row+1,col-1)) {
                moves.push([row+1,col-1]);
            }
            if (this.inBoard(row+1,col+1)) {
                moves.push([row+1,col+1]);
            }
        }
        return moves;
    }

}