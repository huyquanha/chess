import Piece from './piece';

export default class King extends Piece {
    constructor(player) {
        super(player, player === 'black' ? "../images/black-king.svg" : "../images/white-king.svg");
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 0) || (rowDiff === 1 && colDiff === 1);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) { //only move 1 step => no node in between
        return [];
    }
}