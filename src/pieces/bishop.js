import Piece from './piece';

export default class Bishop extends Piece {
    constructor(player) {
        super(player, (player === 'white' ? "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg" : "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg"));
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