export default class Piece {
    constructor(player, imageUrl) {
        this.player = player;
        this.style = {backgroundImage: "url('" + imageUrl + "')"}
    }
}