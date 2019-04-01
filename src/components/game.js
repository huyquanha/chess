import React, {Component} from 'react';
import '../index.css';
import initChessBoard from '../helpers/helper';
import FallenSoldierBlock from './fallen-soldier-block';
import Board from './board';
import King from '../pieces/king';
import Rook from '../pieces/rook';
import Pawn from '../pieces/pawn';
import Queen from '../pieces/queen';
import Knight from '../pieces/knight';
import Bishop from '../pieces/bishop';
import EvolvePicker from '../helpers/evolve-picker';

export default class Game extends Component {
    constructor(props) {
        super(props);
        const squares = initChessBoard();
        const [whitePieces, blackPieces] = this.populatePieces(squares);
        this.state = {
            squares: squares,
            curPlayer: 'white',
            sourceRow: -1,
            sourceCol: -1,
            status: '',
            whiteFallenSoldiers: [],
            blackFallenSoldiers: [],
            whitePieces: whitePieces,
            blackPieces: blackPieces,
            whiteKingPos: [7, 4],
            blackKingPos: [0, 4],
            isCheckMated: false,
            checkMater: null,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleEvolve = this.handleEvolve.bind(this);
    }

    populatePieces(squares) {
        let whitePieces = new Set();
        let blackPieces = new Set();
        for (let r = 0; r <= 7; r++) {
            for (let c = 0; c <= 7; c++) {
                if (squares[r][c]) {
                    if (squares[r][c].player === 'white') {
                        whitePieces.add(squares[r][c]);
                    } else {
                        blackPieces.add(squares[r][c]);
                    }
                }
            }
        }
        return [whitePieces,blackPieces];
    }

    handleClick(i, j) {
        if (this.determineWinner()) {
            return;
        }
        const squares = this.state.squares.slice(); //make a copy
        let curPlayer = this.state.curPlayer;
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (sourceRow === -1 && sourceCol === -1) {
            //no piece has been selected yet. you have to select your own piece and non-null piece
            if (!squares[i][j] || squares[i][j].player !== curPlayer) {
                this.setState({
                    status: 'Invalid selection. Can\'t select empty or not your own piece'
                });
            } else {
                this.highlight(squares[i][j], true);
                this.setState({
                    squares: squares,
                    sourceRow: i,
                    sourceCol: j,
                    status: 'Choose destination for the selected piece'
                })
            }
        } else { //another piece has been selected before
            if (this.isEvolvablePawn([sourceRow, sourceCol])) {
                //if the current selection is a pawn at the other end, it must be evolved
                this.setState({
                    status: 'Please select one of the drop down type to evolve',
                })
            } else {
                this.highlight(squares[sourceRow][sourceCol], false);
                if (squares[i][j] && squares[i][j].player === curPlayer) {
                    this.setState({
                        status: 'Wrong selection. Select source and destination again',
                        sourceRow: -1,
                        sourceCol: -1,
                    })
                } else {
                    const isDestEnemyOccupied = squares[i][j] ? true : false;
                    const isMovePossible = squares[sourceRow][sourceCol].isMovePossible([sourceRow, sourceCol], [i, j],
                        isDestEnemyOccupied);
                    const isPathEmpty = this.isPathEmpty([sourceRow, sourceCol], [i, j]);
                    if (isMovePossible && isPathEmpty) {
                        if (squares[sourceRow][sourceCol] instanceof King) {
                            if (this.kingInDanger([i, j])) { //first check if it will be checkmated
                                this.setState({
                                    status: 'Cannot move king there. Checkmate endangered. Select again',
                                    sourceRow: -1,
                                    sourceCol: -1,
                                })
                            } else if (Math.abs(j - sourceCol) === 2) {  //king wants to enter castle
                                this.handleEnterCastle(sourceRow, sourceCol, j);
                            } else { //normal move
                                this.movePiece(sourceRow, sourceCol, i, j, isDestEnemyOccupied);
                            }
                        } else { //other than king, other pieces move normally
                            this.movePiece(sourceRow, sourceCol, i, j, isDestEnemyOccupied);
                        }
                    } else {
                        this.setState({
                            status: 'Invalid move. either move not possible or path not empty. Please select again',
                            sourceRow: -1,
                            sourceCol: -1
                        })
                    }
                }
            }
        }
    }

    movePiece(srcRow, srcCol, destRow, destCol, isDestEnemyOccupied) {
        const squares = this.state.squares.slice();
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        const whiteMap = new Map(this.state.whitePossibleMoves);
        const blackMap = new Map(this.state.blackPossibleMoves);
        let whiteKingPos = this.state.whiteKingPos;
        let blackKingPos = this.state.blackKingPos;
        let curPlayer = this.state.curPlayer;
        let [checkMateState,status] = this.resolveCheckMate(srcRow,srcCol,destRow,destCol,isDestEnemyOccupied);
        if (checkMateState) {
            this.setState({
                status: status,
                sourceRow: -1,
                sourceCol: -1,
            });
        }
        else {
            if (isDestEnemyOccupied) {
                squares[destRow][destCol].clearMoves();
                if (curPlayer === 'white') {
                    blackMap.delete(squares[destRow][destCol]);
                    blackFallenSoldiers.push(squares[destRow][destCol]);
                } else {
                    whiteMap.delete(squares[destRow][destCol]);
                    whiteFallenSoldiers.push(squares[destRow][destCol]);
                }
            }
            squares[destRow][destCol] = squares[srcRow][srcCol];
            squares[destRow][destCol].addMove([destRow, destCol]);
            squares[srcRow][srcCol] = null;
            //update the possible moves of the piece that is just moved
            this.updatePossibleMoves(destRow, destCol, curPlayer === 'white' ? whiteMap : blackMap);

            if (squares[destRow][destCol] instanceof King) {
                if (curPlayer === 'white') {
                    whiteKingPos = [destRow, destCol];
                } else {
                    blackKingPos = [destRow, destCol];
                }
            }

            if (this.isEvolvablePawn([destRow, destCol])) {
                this.highlight(squares[destRow][destCol], true);
                this.setState({
                    squares: squares,
                    blackFallenSoldiers: blackFallenSoldiers,
                    whiteFallenSoldiers: whiteFallenSoldiers,
                    whitePieces: whitePieces,
                    blackPieces: blackPieces,
                    sourceRow: destRow,
                    sourceCol: destCol,
                    status: 'Please select one of the drop down type to evolve'
                })
            } else {
                //after moving, see if the piece in the new position checkmate the opponent's king
                checkMateState = this.kingCheckMated(squares[destRow][destCol]);
                status = checkMateState ? 'Checkmated. Please resolve' : '';
                let checkMater = checkMateState ? squares[destRow][destCol] : null;

                this.setState({
                    squares: squares,
                    blackFallenSoldiers: blackFallenSoldiers,
                    whiteFallenSoldiers: whiteFallenSoldiers,
                    whitePieces: whitePieces,
                    blackPieces: blackPieces,
                    whiteKingPos: whiteKingPos,
                    blackKingPos: blackKingPos,
                    sourceRow: -1,
                    sourceCol: -1,
                    status: status,
                    curPlayer: curPlayer === 'white' ? 'black' : 'white',
                    isCheckMated: checkMateState,
                    checkMater: checkMater,
                })
            }
        }
    }

    /*
    * Check if the king is currently checkmated or the path is endangered
    * Then check if the other piece is a rook, has never moved and path is empty
    */
    handleEnterCastle(sourceRow, sourceCol, destCol) {
        const squares = this.state.squares.slice();
        const middleSpace = squares[sourceRow][sourceCol].getPathToDest([sourceRow, destCol])[0];
        if (squares[sourceRow][sourceCol] instanceof King) { //just to be sure
            if (squares[sourceRow][sourceCol].hasMoved()) {
                this.setState({
                    status: 'Cannot enter castle because king has been moved before. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else if (this.state.isCheckMated) {
                this.setState({
                    status: 'Cannot enter castle because king is being checkmated. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else if (this.kingInDanger(squares[sourceRow][sourceCol],middleSpace)) {
                this.setState({
                    status: 'Cannot enter castle because the middle space is endangered. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                });
            }
            else {
                const curPlayer = this.state.curPlayer;
                let whiteKingPos = this.state.whiteKingPos;
                let blackKingPos = this.state.blackKingPos;
                let rookSourceCol, rookDestCol;

                if (destCol > sourceCol) {
                    rookSourceCol = destCol + 1;
                    rookDestCol = destCol - 1;
                } else {
                    rookSourceCol = destCol - 2;
                    rookDestCol = destCol + 1;
                }
                let piece = squares[sourceRow][rookSourceCol];
                if (piece instanceof Rook) {
                    if (!piece.hasMoved()) {
                        if (this.isPathEmpty(piece, [sourceRow, rookDestCol])) {
                            //move the king
                            squares[sourceRow][destCol] = squares[sourceRow][sourceCol];
                            squares[sourceRow][destCol].addMove([sourceRow, destCol]);
                            squares[sourceRow][sourceCol] = null;
                            curPlayer === 'white' ? whiteKingPos = [sourceRow, destCol] : blackKingPos = [sourceRow, destCol];

                            //move the rook
                            piece.addMove([sourceRow, rookDestCol]);
                            squares[sourceRow][rookDestCol] = piece;
                            squares[sourceRow][rookSourceCol] = null;

                            //check if the new rook is going to check mate the other king at its new position
                            let isCheckMated = this.kingCheckMated(squares[sourceRow][rookDestCol]);
                            let status = isCheckMated ? 'Checkmated. Please resolve' : '';
                            let checkMater = isCheckMated ? squares[sourceRow][rookDestCol] : null;

                            this.setState({
                                squares: squares,
                                sourceRow: -1,
                                sourceCol: -1,
                                status: status,
                                whiteKingPos: whiteKingPos,
                                blackKingPos: blackKingPos,
                                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                                isCheckMated: isCheckMated,
                                checkMater: checkMater,
                            });
                        }
                        else {
                            this.setState({
                                status: 'Cannot enter castle because rook src->dest is not empty. Select again',
                                sourceRow: -1,
                                sourceCol: -1,
                            });
                        }
                    }
                    else {
                        this.setState({
                            status: 'Cannot enter castle because rook has been moved before. Select again',
                            sourceRow: -1,
                            sourceCol: -1,
                        });
                    }
                }
                else {
                    this.setState({
                        status: 'The corresponding piece is not a rook. Select again',
                        sourceRow: -1,
                        sourceCol: -1,
                    });
                }
            }
        }
    }

    /*
     * after user selects a type, evolve the pawn into that type, and check
     * if the just evolved piece checkmate opponent's king
     */
    handleEvolve(type) {
        const squares = this.state.squares.slice();
        let curPlayer = this.state.curPlayer;
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        const whitePieces = new Set(this.state.whitePieces);
        const blackPieces = new Set(this.state.blackPieces);
        if (this.isEvolvablePawn([sourceRow, sourceCol])) {
            this.highlight(squares[sourceRow][sourceCol], false);
            squares[sourceRow][sourceCol].clearMoves();
            if (curPlayer === 'white') {
                whitePieces.delete(squares[sourceRow][sourceCol]);
                whiteFallenSoldiers.push(squares[sourceRow][sourceCol]);
            } else {
                blackPieces.delete(squares[sourceRow][sourceCol]);
                blackFallenSoldiers.push(squares[sourceRow][sourceCol]);
            }
            switch (type) {
                case 'queen':
                    squares[sourceRow][sourceCol] = new Queen(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'rook':
                    squares[sourceRow][sourceCol] = new Rook(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'knight':
                    squares[sourceRow][sourceCol] = new Knight(curPlayer, [sourceRow, sourceCol]);
                    break;
                case 'bishop':
                    squares[sourceRow][sourceCol] = new Bishop(curPlayer, [sourceRow, sourceCol]);
                    break;
                default:
                    break;
            }
            curPlayer==='white' ? whitePieces.add(squares[sourceRow][sourceCol]) :
                blackPieces.add(squares[sourceRow][sourceCol]);
            //check if the just evolved piece check mate the opponent's king
            let isCheckMated = this.kingCheckMated(squares[sourceRow][sourceCol]);
            let status = isCheckMated ? 'Checkmated. Please resolve' : '';
            let checkMater = isCheckMated ? squares[sourceRow][sourceCol] : null;
            this.setState({
                squares: squares,
                whiteFallenSoldiers: whiteFallenSoldiers,
                blackFallenSoldiers: blackFallenSoldiers,
                whitePieces: whitePieces,
                blackPieces: blackPieces,
                sourceRow: -1,
                sourceCol: -1,
                status: status,
                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                isCheckMated: isCheckMated,
                checkMater: checkMater,
            })
        } else {
            this.setState({
                status: 'Not the time to evolve right now',
            })
        }
    }

    /*
       return true if opponent king is checkmated by piece, otherwise false
    */
    kingCheckMated(piece) {
        const curPlayer = this.state.curPlayer;
        const oppKingPos = (curPlayer === 'white' ? this.state.blackKingPos : this.state.whiteKingPos);
        if (piece.isMovePossible(oppKingPos,true) && this.isPathEmpty(piece,oppKingPos)) {
            return true;
        }
        return false;
    }

    /*
     * To be used to resolve check mate (if there's any) when making a move in movePiece()
     * When being checkmated, the curPlayer either has to move the king, eat the checkmater
     * or move a piece to block the check path from checkmater to king
     */
    resolveCheckMate(srcRow, srcCol, destRow, destCol, isDestEnemyOccupied) {
        const squares = this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        let isCheckMated = this.state.isCheckMated;
        let checkMater = this.state.checkMater;
        let status = '';
        if (isCheckMated) {
            //if our move is to eat the checkmater (for the king, whether it will be safe after eating has been checked)
            //then the checkmate is resolved
            if (isDestEnemyOccupied && squares[destRow][destCol]===checkMater) {
                isCheckMated=false;
            }
            else if (squares[srcRow][srcCol] instanceof King) {
                //if we move the king. Remember we already check that the destination will be safe for the king
                isCheckMated=false;
            } else { //if we move something else, it has to block the check path
                const kingPos = curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos;
                for (let space of checkMater.getPathToDest(kingPos)) {
                    if (destRow === space[0] && destCol === space[1]) {
                        isCheckMated = false;
                    }
                }
                if (isCheckMated) {
                    status = 'The move does not block check path. Select again';
                }
            }
        }
        return [isCheckMated, status];
    }

    /*
     * check if the piece is moved to destRow, destCol, will it cause a problem for the king
     * The piece can be the king, or something else
     */
    kingInDanger(piece,[destRow, destCol]) {
        const curPlayer = this.state.curPlayer;
        const enemies = curPlayer === 'white' ? this.state.blackPieces : this.state.whitePieces;
        const checkMater = this.state.checkMater; //may or may not be null
        if (piece instanceof King) {
            for (let enemy of enemies) {
                if (enemy.isMovePossible([destRow,destCol],true)) {
                    //isDestEnemyOccupied = true because after the king moves there, it becomes true.
                    if (checkMater && enemy===checkMater) {
                        return true;
                    }
                    else if (this.isPathEmpty(enemy,[destRow,destCol])) {
                        return true;
                    }
                }
            }
            return false;
        }
        else {
            const kingPos = curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos;
            if (checkMater) { //king is being checkmated, so we need to put something in the check path or eat the checkmater
                const path = checkMater.getPathToDest(kingPos);
                path.push(checkMater.getCurrentPos());
                for (let space of checkMater.getPathToDest(kingPos)) {
                    if (destRow === space[0] && destCol === space[1]) { //the piece blocks the path or eat the checkmater
                        return false;
                    }
                }
                return true;
            }
            else {
                const squares = this.state.squares;
                for (let enemy of enemies) {
                    if (enemy.isMovePossible(kingPos,true)) {
                        let blockers=[];
                        let [enemyRow,enemyCol] = enemy.getCurrentPos();
                        for (let [row,col] of enemy.getPathToDest(kingPos)) {
                            if (squares[row][col]) {
                                blockers.push(squares[row][col]);
                            }
                        }
                        if (blockers.length===1 && blockers[0]===piece &&
                            !(enemyRow === destRow && enemyCol===destCol)) {
                            //only one blocker, it's the piece being moved, and does not eat the enemy
                            return true; //because then king is in danger
                        }
                    }
                }
                return false;
            }
        }
    }

    /*
     * Check if the piece at [row,col] is an evolvable pawn or not
     */
    isEvolvablePawn([row, col]) {
        const squares = this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        return (row !== -1 && col !== -1 && squares[row][col] instanceof Pawn
            && row === (curPlayer === 'white' ? 0 : 7));
    }

    /*
     * Check if the path from source to destination does not contain any piece
     */
    isPathEmpty(piece, [destRow, destCol]) {
        let path = piece.getPathToDest([destRow, destCol]);
        for (let space of path) {
            if (this.state.squares[space[0]][space[1]]) {
                return false;
            }
        }
        return true;
    }

    highlight(piece, shouldHighlight) {
        if (shouldHighlight) {
            piece.style = {...piece.style, backgroundColor: "RGB(111,143,114)"};
        } else {
            piece.style = {...piece.style, backgroundColor: ""};
        }
    }

    render() {
        let winner = this.determineWinner();
        let status = this.state.status;
        if (winner) {
            status='Winner: ' + winner;
            if (winner === 'Draw') {
                status = 'The game is draw';
            }
        }
        return (
            <div className="game">
                <Board squares={this.state.squares}
                       onClick={(i, j) => this.handleClick(i, j)}/>
                <div className="game-info">
                    <h3>Turn</h3>
                    <div id="player-turn-box"
                         style={{
                             backgroundColor:
                                 this.state.curPlayer === 'white' ? "#fff" : "#000"
                         }}/>
                    <EvolvePicker onSubmit={(type) => this.handleEvolve(type)}/>
                    <br/>
                    <div className="status">{status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }

    getKingValidMoves() {
        const curPlayer = this.state.curPlayer;
        const squares = this.state.squares.slice();
        const [kingRow,kingCol] = (curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos);
        const king = squares[kingRow][kingCol];
        let validMoves=[];
        for (let [row,col] of king.getPossibleMoves()) {
            if (!(squares[row][col] && squares[row][col].player===curPlayer)
                && !this.kingInDanger(king,[row,col])) {
                validMoves.push([row,col]);
            }
        }
        return validMoves;
    }

    /*this method is only called when isCheckMated=true, so checkMater is not null
    * get all the pieces that can block the check path for king (king is currently checkmated)
    * and include the position of the checkmater as well, in case a piece can eat the checkmater
    * */
    getBlockersForKing() {
        const curPlayer = this.state.curPlayer;
        const pieces = curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces;
        const [kingRow,kingCol] = (curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos);
        const checkMater = this.state.checkMater;
        let blockers=new Set(); //use a set to eliminate duplicate
        let path = checkMater.getPathToDest([kingRow,kingCol]);
        let [checkRow,checkCol] = checkMater.getCurrentPos();
        for (let piece of pieces) { //iterate over all of current player's piece and possible moves
            if ((piece instanceof King)===false) { //we only iterate the pieces that are not king
                if (piece.isMovePossible([checkRow,checkCol],true) && this.isPathEmpty(piece,checkMater.getCurrentPos())) {
                    blockers.add(piece); //piece can eat checkmater
                }
                else {
                    for (let space of path) {
                        if (piece.isMovePossible(space,false)) { //false because no space on path contains any piece
                            blockers.add(piece);
                        }
                    }
                }
            }
        }
        return blockers;
    }

    anotherMovePossible() {
        const curPlayer = this.state.curPlayer;
        const pieces = (curPlayer==='white' ? this.state.whitePieces : this.state.blackPieces);
        const squares = this.state.squares;
        for (let piece of pieces) {
            if (!(piece instanceof King)) {
                if (piece instanceof Pawn) {
                    for (let [possRow,possCol] of piece.getPossibleMoves()) {
                        if (!squares[possRow][possCol] && this.isPathEmpty(piece,[possRow,possCol])) {
                            return true;
                        }
                    }
                    for (let [tarRow,tarCol] of piece.getPossibleTargets()) {
                        if (squares[tarRow][tarCol] && squares[tarRow][tarCol].player !== curPlayer
                            && this.isPathEmpty(piece,[tarRow,tarCol])) {
                            return true;
                        }
                    }
                }
                else {
                    for (let [possRow,possCol] of piece.getPossibleMoves()) {
                        if (!(squares[possRow][possCol] && squares[possRow][possCol].player===curPlayer)
                            && this.isPathEmpty(piece,[possRow,possCol])) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    determineWinner() {
        let winner=null;
        const curPlayer = this.state.curPlayer;
        const isCheckMated = this.state.isCheckMated;
        if (isCheckMated) {
            //king can't move anywhere, and no other pieces (if any) can save the king, and king is checkmated
            if (this.getKingValidMoves().length===0 && this.getBlockersForKing().size===0) {
                winner = curPlayer==='white' ? 'black' : 'white';
            }
        }
        else {
            if (this.getKingValidMoves().length===0 && !this.anotherMovePossible()) {
                winner = 'Draw';
            }
        }
        return winner;
    }
}
