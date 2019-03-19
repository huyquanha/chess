import Piece from './piece';

export default class Pawn extends Piece {
    constructor(player) {
        super(player, (player === 'white' ? "images/white-pawn.svg" : "images/black-pawn.svg"));
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

        if (isDestEnemyOccupied && rowDiff === 1 && colDiff === 1) {
            return true;
        }
        if (this.isInitialPosition(sourceRow)) {
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

}