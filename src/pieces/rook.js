import Piece from './piece';

export default class Rook extends Piece {
    constructor(player) {
        super(player, player === 'black' ? "../images/black-rook.svg" : "../images/white-rook.svg");
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);

        return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0);
    }

    getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = sourceRow - destRow;
        let colDiff = sourceCol - destCol;
        let path = [];
        if (rowDiff === 0) { //move horizontally
            if (colDiff > 0) {
                for (let i = sourceCol - 1; i > destCol; i--) {
                    path.push([sourceRow, i]);
                }
            } else {
                for (let i = sourceCol + 1; i < destCol; i++) {
                    path.push([sourceRow, i]);
                }
            }
        } else { //move vertically
            if (rowDiff > 0) {
                for (let i = sourceRow - 1; i > destRow; i--) {
                    path.push([i, sourceCol]);
                }
            } else {
                for (let i = sourceRow + 1; i < destRow; i++) {
                    path.push([i, sourceCol]);
                }
            }
        }
        return path;
    }
}