import Piece from './piece';

export default class Knight extends Piece {
    constructor(player,initPos) {
        super(player, (player === 'white' ? "images/white-knight.svg" : "images/black-knight.svg"),initPos);
    }

    isMovePossible([sourceRow, sourceCol], [destRow, destCol]) {
        let rowDiff = Math.abs(sourceRow - destRow);
        let colDiff = Math.abs(sourceCol - destCol);
        return (rowDiff !== colDiff && [1, 2].includes(rowDiff) && [1, 2].includes(colDiff));
    }

    getPathToDest([sourceCol, destCol]) { //knight can jump over anybody -> []
        return [];
    }

    getPossibleMoves() {
        const [row,col] = this.getCurrentPos();
        let moves=[];
        let rowOffsets = [-2,-1,1,2];
        let colOffsets = [-2,-1,1,2];
        for (let i of rowOffsets) {
            for (let j of colOffsets) {
                if (Math.abs(i) !== Math.abs(j) && this.inBoard(row+i,col+j)) {
                    moves.push([row+i,col+j]);
                }
            }
        }
        return moves;
    }
}