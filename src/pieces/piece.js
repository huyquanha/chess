export default class Piece {
    constructor(player, imageUrl, initPos, hasMoved) {
        this.player = player;
        this.style = {backgroundImage: "url('" + imageUrl + "')"};
        this.hasMoved = hasMoved ? hasMoved : false;
        this.currentPos = initPos;
        this.className = null;
    }

    //check whether the position is in the game board or not
    inBoard(row,col) {
        return row>=0 && row <=7 && col>=0 && col<=7;
    }
}