import Piece from './piece';

export default class Queen extends Piece {
    constructor(player) {
        super(player, (player === 'white' ? "images/white-queen.svg" : "images/black-queen.svg"));
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff === 0 && colDiff > 0) || (rowDiff > 0 && colDiff === 0) || (rowDiff > 0 && colDiff === rowDiff);
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
        } else if (colDiff === 0) { //move vertically
            if (rowDiff > 0) {
                for (let i = sourceRow - 1; i > destRow; i--) {
                    path.push([i, sourceCol]);
                }
            } else {
                for (let i = sourceRow + 1; i < destRow; i++) {
                    path.push([i, sourceCol]);
                }
            }
        } else { //move diagonally => abs(colDiff)===abs(rowDiff)
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
        }
        return path;
    }
}