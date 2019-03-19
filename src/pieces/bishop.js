import Piece from './piece';

export default class Bishop extends Piece {
    constructor(player) {
        super(player, (player === 'white' ? "images/white-bishop.svg" : "images/black-bishop.svg"));
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);

        return (rowDiff > 0 && rowDiff === colDiff);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = sourceRow - destRow;
        let colDiff = sourceCol - destCol;
        let path = [];
        if (rowDiff > 0 && colDiff > 0) {
            for (let i = 1; i < rowDiff; i++) {
                path.push([sourceRow - i, sourceCol - i]);
            }
        } else if (rowDiff < 0 && colDiff < 0) {
            for (let i = 1; i < rowDiff; i++) {
                path.push([sourceRow + i, sourceCol + i]);
            }
        } else if (rowDiff > 0 && colDiff < 0) {
            for (let i = 1; i < rowDiff; i++) {
                path.push([sourceRow - i, sourceCol + i]);
            }
        } else {
            for (let i = 1; i < rowDiff; i++) {
                path.push([sourceRow + i, sourceCol - i]);
            }
        }
        return path;
    }
}