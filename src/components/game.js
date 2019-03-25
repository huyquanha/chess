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
        const possibleMoves = this.populatePossibleMoves(squares);
        this.state = {
            squares: squares,
            curPlayer: 'white',
            sourceRow: -1,
            sourceCol: -1,
            status: '',
            whiteFallenSoldiers: [],
            blackFallenSoldiers: [],
            whitePossibleMoves: possibleMoves[0],
            blackPossibleMoves: possibleMoves[1],
            whiteKingPos: [7, 4],
            blackKingPos: [0, 4],
            isCheckMated: false,
            checkMater:null,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleEvolve = this.handleEvolve.bind(this);
    }

    populatePossibleMoves(squares) {
        let possibleMoves = [];
        let whiteMap = new Map();
        let blackMap = new Map();
        for (let r = 0; r <= 7; r++) {
            for (let c = 0; c <= 7; c++) {
                if (squares[r][c]) {
                    if (squares[r][c].player === 'white') {
                        whiteMap.set(squares[r][c], squares[r][c].getPossibleMoves());
                    } else {
                        blackMap.set(squares[r][c], squares[r][c].getPossibleMoves());
                    }
                }
            }
        }
        possibleMoves.push(whiteMap); //at 0
        possibleMoves.push(blackMap); //at 1
        return possibleMoves;
    }

    updatePossibleMoves(row, col, map) {
        const piece = this.state.squares[row][col];
        map.set(piece, piece.getPossibleMoves());
    }

    handleClick(i, j) {
        const squares = this.state.squares.slice(); //make a copy
        let curPlayer = this.state.curPlayer;
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (sourceRow === -1 && sourceCol === -1) { //no piece has been selected yet. you have to select your own piece and non-null piece
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
                    whitePossibleMoves: whiteMap,
                    blackPossibleMoves: blackMap,
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
                    whitePossibleMoves: whiteMap,
                    blackPossibleMoves: blackMap,
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

    handleEnterCastle(sourceRow, sourceCol, destCol) {
        const squares = this.state.squares.slice();
        if (this.state.isCheckMated || this.kingInDanger(squares[sourceRow][sourceCol].getSrcToDestPath()[0])) {
            this.setState({
                status: 'Cannot enter castle when king is checkmated/the path is endangered. Select again',
                sourceRow: -1,
                sourceCol: -1,
            })
        }
        else {
            const curPlayer = this.state.curPlayer;
            const whiteMap = new Map(this.state.whitePossibleMoves);
            const blackMap = new Map(this.state.blackPossibleMoves);
            let rookSourceCol, rookDestCol;

            if (destCol > sourceCol) {
                rookSourceCol = destCol + 1;
                rookDestCol = destCol - 1;
            } else {
                rookSourceCol = destCol - 2;
                rookDestCol = destCol + 1;
            }
            let piece = squares[sourceRow][rookSourceCol];
            if (piece instanceof Rook && !piece.hasMoved() &&
                this.isPathEmpty([sourceRow, rookSourceCol], [sourceRow, rookDestCol])) {
                //move the king
                squares[sourceRow][destCol] = squares[sourceRow][sourceCol];
                squares[sourceRow][destCol].addMove([sourceRow, destCol]);
                squares[sourceRow][sourceCol] = null;
                this.updatePossibleMoves(sourceRow, destCol, curPlayer === 'white' ? whiteMap : blackMap);

                //move the rook
                piece.addMove([sourceRow, rookDestCol]);
                squares[sourceRow][rookDestCol] = piece;
                squares[sourceRow][rookSourceCol] = null;
                this.updatePossibleMoves(sourceRow, rookDestCol, curPlayer === 'white' ? whiteMap : blackMap);

                //check if the new rook is going to check mate the other king at its new position
                let isCheckMated = this.kingCheckMated(squares[sourceRow][rookDestCol]);
                let status = isCheckMated ? 'Checkmated. Please resolve' : '';

                this.setState({
                    squares: squares,
                    sourceRow: -1,
                    sourceCol: -1,
                    status: status,
                    whitePossibleMoves: whiteMap,
                    blackPossibleMoves: blackMap,
                    curPlayer: curPlayer === 'white' ? 'black' : 'white',
                    isCheckMated: isCheckMated
                })
            } else {
                this.setState({
                    status: 'Enter castle is not possible. Select again',
                    sourceRow: -1,
                    sourceCol: -1,
                })
            }
        }
    }

    handleEvolve(type) {
        const squares = this.state.squares.slice();
        let curPlayer = this.state.curPlayer;
        const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
        const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
        let sourceRow = this.state.sourceRow;
        let sourceCol = this.state.sourceCol;
        if (this.isEvolvablePawn([sourceRow, sourceCol])) {
            this.highlight(squares[sourceRow][sourceCol], false);
            squares[sourceRow][sourceCol].clearMoves();
            if (curPlayer === 'white') {
                whiteFallenSoldiers.push(squares[sourceRow][sourceCol]);
            } else {
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
            //check if the just evolved piece check mate the opponent's king
            let isCheckMated = this.kingCheckMated(squares[sourceRow][sourceCol]);
            let status = isCheckMated ? 'Checkmated. Please resolve' : '';
            this.setState({
                squares: squares,
                whiteFallenSoldiers: whiteFallenSoldiers,
                blackFallenSoldiers: blackFallenSoldiers,
                sourceRow: -1,
                sourceCol: -1,
                status: status,
                curPlayer: curPlayer === 'white' ? 'black' : 'white',
                isCheckMated: isCheckMated,
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
        const kingPos = curPlayer === 'white' ? this.state.blackKingPos : this.state.whiteKingPos;
        for (let [possRow, possCol] of piece.getPossibleMoves()) {
            //if one of the possible move is the king of the opponent, and there's nothing in between
            if (possRow === kingPos[0] && possCol === kingPos[1]
                && this.isPathEmpty(piece.getCurrentPos(), kingPos)) {
                return true;
            }
        }
        return false;
    }

    resolveCheckMate(srcRow,srcCol,destRow,destCol,isDestEnemyOccupied) {
        const squares =this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        let isCheckMated = this.state.isCheckMated;
        let checkMater = this.state.checkMater;
        let status='';
        if (isCheckMated) {
            if (squares[srcRow][srcCol] instanceof King) { //if we move the king
                if(!this.kingInDanger([destRow,destCol])) {
                    isCheckMated=false;
                }
                else {
                    status = 'Cannot move king there. Checkmate Endangered. Select again';
                }
            }
            else { //if we move something else, it either has to eat the checkmater, or block the check path
                if (isDestEnemyOccupied && squares[destRow][destCol]===checkMater) {
                    //if we are going to eat the checkmater
                    isCheckMated=false;
                }
                else {
                    const kingPos = curPlayer === 'white' ? this.state.whiteKingPos : this.state.blackKingPos;
                    for (let space of checkMater.getSrcToDestPath(checkMater.getCurrentPos(),kingPos)) {
                        if (destRow===space[0] && destCol ===space[1]) {
                            isCheckMated = false;
                        }
                    }
                    if (isCheckMated) {
                        status='The move does not block check path. Select again';
                    }
                }
            }
        }
        return [isCheckMated,status];
    }

    //this is only called if we confirmed it's a king being moved, so no need to check
    kingInDanger([destRow, destCol]) {
        const curPlayer = this.state.curPlayer;
        const threatMap = curPlayer === 'white' ? this.state.blackPossibleMoves : this.state.whitePossibleMoves;
        for (let [piece, possibleMoves] of threatMap) {
            for (let move of possibleMoves) {
                //if one of the possible move of the opponent's move is the same as dest
                //and the path from the piece itself to the dest is empty, then king is in danger
                if (move[0] === destRow && move[1] === destCol && this.isPathEmpty(piece.getCurrentPos(), [destRow, destCol])) {
                    return true;
                }
            }
        }
        return false;
    }

    isEvolvablePawn([row, col]) {
        const squares = this.state.squares.slice();
        const curPlayer = this.state.curPlayer;
        return (row !== -1 && col !== -1 && squares[row][col] instanceof Pawn
            && row === (curPlayer === 'white' ? 0 : 7));
    }

    isPathEmpty([sourceRow, sourceCol], [destRow, destCol]) {
        let piece = this.state.squares[sourceRow][sourceCol];
        let path = piece.getSrcToDestPath([sourceRow, sourceCol], [destRow, destCol]);
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
                    <div className="status">{this.state.status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }
}
