export default class Piece {
    constructor(player, imageUrl, initPos) {
        this.player = player;
        this.style = {backgroundImage: "url('"+imageUrl+"')"};
        this.moves = [initPos];
        this.className=null;
    }

    addMove([destRow,destCol]) {
        this.moves.push([destRow,destCol]);
    }

    getCurrentPos() {
        return this.moves[this.moves.length-1];
    }

    clearMoves() {
        this.moves=[];
    }

    hasMoved() { //there's another move except from the initial pos
        return this.moves.length >1;
    }

    //check whether the position is in the game board or not
    inBoard(row,col) {
        return row>=0 && row <=7 && col>=0 && col<=7;
    }
}