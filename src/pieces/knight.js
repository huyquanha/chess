import Piece from './piece';

export default class Knight extends Piece {
    constructor(player) {
        super(player, (player === 'black' ? "../images/black-knight.svg" : "../images/white-knight.svg"));
    }

    isMovePossible([sourceRow, destRow], [sourceCol, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff !== colDiff && [1, 2].includes(rowDiff) && [1, 2].includes(colDiff));
    }

    getSrcToDestPath([sourceRow, destRow], [sourceCol, destCol]) { //knight can jump over anybody -> []
        return [];
    }
}