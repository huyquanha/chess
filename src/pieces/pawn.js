import Piece from './piece';

export default class Pawn extends Piece {
    constructor(player,initPos, hasMoved) {
        super(player, (player === 'white' ? "images/white-pawn.svg" : "images/black-pawn.svg"),initPos, hasMoved);
        this.initialPos = {
            blackSourceRow: 1, //top of the board
            whiteSourceRow: 6, //bottom of the board
        }
    }

    isInitialPosition() {
        let [row,col] = this.currentPos;
        return (this.player === 'white' && row === this.initialPos.whiteSourceRow) ||
            (this.player === 'black' && row === this.initialPos.blackSourceRow);
    }

    isMovePossible([destRow, destCol], isDestEnemyOccupied, isDestPawnCaptured) {
        let [sourceRow,sourceCol] = this.currentPos;
        let colDiff = Math.abs(sourceCol - destCol);
        let rowDiff = this.player === 'white' ? sourceRow - destRow : destRow - sourceRow;

        if (isDestEnemyOccupied || isDestPawnCaptured) {
            return (rowDiff === 1 && colDiff === 1);
        }
        else if (this.isInitialPosition()) {
            return colDiff === 0 && [1, 2].includes(rowDiff);
        } else {
            return colDiff === 0 && rowDiff === 1;
        }
    }

    getPathToDest([destRow, destCol]) { //can move 1 or 2 step. If move 2 step, there's a square in between src and dest
        let [sourceRow,sourceCol] = this.currentPos;
        let rowDiff = this.player === 'white' ? sourceRow - destRow : destRow - sourceRow;
        if (rowDiff === 2) {
            return [[(sourceRow + destRow) / 2, sourceCol]];
        } else {
            return [];
        }
    }

    getPossibleMoves() {
        const [row,col] = this.currentPos;
        let moves=[];
        if (this.player==='white') { //move up, row decrease
            if (this.inBoard(row-1,col)) {
                moves.push([row-1,col]);
            }
            if (this.isInitialPosition()) { //if initial position, [row-2,col] is of course in board => don't need to check
                moves.push([row-2,col]);
            }
        }
        else {
            if (this.inBoard(row+1,col)) {
                moves.push([row+1,col]);
            }
            if (this.isInitialPosition(row)) { //if in initial position, [row+2,col] is of course in board => dont' need to check
                moves.push([row+2,col]);
            }
        }
        return moves;
    }

    //for other pieces, the move they can eat and the move they go are the same, but not for pawn
    getPossibleTargets() {
        const [row,col] = this.currentPos;
        let targets=[];
        if (this.player ==='white') { //pawn can eat up, or the row should decrease
            if (this.inBoard(row-1,col-1)) {
                targets.push([row-1,col-1]);
            }
            if (this.inBoard(row-1,col+1)) {
                targets.push([row-1,col+1]);
            }
        }
        else { //pawn eat down, or the row increase
            if (this.inBoard(row+1,col-1)) {
                targets.push([row+1,col-1]);
            }
            if (this.inBoard(row+1,col+1)) {
                targets.push([row+1,col+1]);
            }
        }
        return targets;
    }
}
