import Piece from './piece';

export default class Knight extends Piece {
    constructor(player) {
        super(player, (player === 'white' ? "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg"));
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff !== colDiff && [1, 2].includes(rowDiff) && [1, 2].includes(colDiff));
    }

    getSrcToDestPath([sourceRow, destRow], [sourceCol, destCol]) { //knight can jump over anybody -> []
        return [];
    }
}