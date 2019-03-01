import Piece from './piece';

export default class Queen extends Piece {
    constructor(player) {
        super(player, player === 'black' ? "../images/black-queen.svg" : "../images/white-queen.svg");
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff === 0 && colDiff > 0) || (rowDiff >0 && colDiff===0) || (rowDiff > 0 && colDiff === rowDiff);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) {
        return [];
    }
}