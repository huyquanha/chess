export default class Piece {
    constructor(player, imageUrl) {
        this.player = player;
        this.style = {backgroundImage: "url('"+imageUrl+"')"};
        this.moves = [];
    }

    addMove([destRow,destCol]) {
        this.moves.push([destRow,destCol]);
    }

    getMoves() {
        return this.moves;
    }

    clearMoves() {
        this.moves=[];
    }

    hasMoved() {
        return this.moves.length !==0;
    }
}