import Piece from './piece';

export default class King extends Piece {
    constructor(player) {
        super(player, player === 'black' ? "../images/black-king.svg" : "../images/white-king.svg");
    }

    isMovePossible([sourceRow,sourceCol],[destRow,destCol]) {
        if (sourceRow===destRow && sourceCol===destCol) {
            return false;
        }
        return ([0,1].includes(Math.abs(sourceRow-destRow)) && [0,1].includes(Math.abs(sourceCol-destCol)));
    }

    getSrcToDestPath([sourceRow,sourceCol],[destRow,destCol]) { //only move 1 step => no node in between
        return [];
    }
}