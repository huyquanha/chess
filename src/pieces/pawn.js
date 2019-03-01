import Piece from './piece';

export default class Pawn extends Piece {
    constructor(player) {
        super(player, player === 'black' ? "../images/black-pawn.svg" : "../images/white-pawn.svg");
        this.initialPos = {
            blackSourceRow: 1, //top of the board
            whiteSourceRow: 6, //bottom of the board
        }
    }

    isInitialPosition(sourceRow) {
        return (this.player === 'white' && sourceRow == this.initialPos.whiteSourceRow) || (this.player === 'black' && sourceRow == this.initialPos.blackSourceRow);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol], isDestEnemyOccupied) {
        let sameCol = destCol === sourceCol;
        let rowDiff = this.player==='white' ? sourceRow-destRow : destRow-sourceRow;
        
        if (this.player === 'white') {
            if (isDestEnemyOccupied && sourceRow - destRow === 1 && Math.abs(sourceCol - destCol) === 1) { //only go diagonal if occupied by an enemy
                return true;
            }
            if (this.isInitialPosition(sourceRow)) { //in white initial position
                return sameCol && [1, 2].includes(sourceRow - destRow); //move upward the board => row decrease
            } else {
                return sameCol && sourceRow - destRow === 1;
            }
        } else { //black
            if (isDestEnemyOccupied && destRow - sourceRow === 1 && Math.abs(sourceCol - destCol) === 1) { //only go diagonal if occupied by an enemy
                return true;
            }
            if (this.isInitialPosition(sourceRow)) { //in black initial position
                return sameCol && [1, 2].includes(destRow - sourceRow); //move downward the board => row increase
            } else {
                return sameCol && destRow - sourceRow === 1;
            }
        }
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) { //can move 1 or 2 step. If move 2 step, there's a square in between src and dest
        if (this.player === 'white') {
            if (sourceRow - destRow == 2) { //the pawn moves 2 step
                return [[sourceRow - 1, sourceCol]]
            } else {
                return [];
            }
        } else { //black
            if (destRow - sourceRow == 2) { //the pawn moves 2 step
                return [[sourceRow + 1, sourceCol]]
            } else {
                return [];
            }
        }
    }

}