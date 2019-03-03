import React, {Component} from 'react';
import '../index.css';
import initChessBoard from '../helpers/helper';
import FallenSoldierBlock from './fallen-soldier-block';
import Board from './board';

export default class Game extends Component {
    constructor(props) {
        super(props);
        this.state={
            squares: initChessBoard(),
            curPlayer:'white',
            sourceRow: -1,
            sourceCol: -1,
            status:'',
            whiteFallenSoldiers:[],
            blackFallenSoldiers:[],
        }
        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(i,j) {
        const squares = this.state.squares.slice(); //make a copy
        //let piece = squares[i][j]; //the selected piece, either null, or player====black/player===white
        let curPlayer = this.state.curPlayer;
        let sourceRow=this.state.sourceRow;
        let sourceCol=this.state.sourceCol;
        if (sourceRow===-1 && sourceCol===-1) { //no piece has been selected yet. you have to select your own piece and non-null piece
            if (!squares[i][j] || squares[i][j].player !== curPlayer) {
                this.setState({
                    status:'Invalid selection'
                });
            }
            else {
                squares[i][j].style={...squares[i][j].style, backgroundColor: "RGB(111,143,114)"}; //change background of the selected piece
                this.setState({
                    squares: squares,
                    sourceRow: i,
                    sourceCol: j,
                    status: 'Choose destination for the selected piece'
                })
            }
        }
        else { //another piece has been selected before
            let sourcePiece = squares[sourceRow][sourceCol];
            delete sourcePiece.style.backgroundColor;
            if (squares[i][j] && squares[i][j].player===curPlayer) {
                this.setState({
                    status: 'Wrong selection. Select source and destination again',
                    sourceRow: -1,
                    sourceCol: -1,
                })
            }
            else {
                const isDestEnemyOccupied=squares[i][j]? true : false;
                const isMovePossible = sourcePiece.isMovePossible([sourceRow,sourceCol],[i,j],isDestEnemyOccupied);
                const isPathEmpty = this.isPathEmpty([sourceRow,sourceCol],[i,j]);
                if (isMovePossible && isPathEmpty) {
                    const whiteFallenSoldiers = this.state.whiteFallenSoldiers.slice();
                    const blackFallenSoldiers = this.state.blackFallenSoldiers.slice();
                    if (isDestEnemyOccupied) {
                        if (curPlayer==='white') {
                            blackFallenSoldiers.push(squares[i][j]);
                        }
                        else {
                            whiteFallenSoldiers.push(squares[i][j]);
                        }
                    }
                    squares[i][j]=JSON.parse(JSON.stringify(sourcePiece));
                    sourcePiece=null;
                    this.setState({
                        squares: squares,
                        blackFallenSoldiers: blackFallenSoldiers,
                        whiteFallenSoldiers: whiteFallenSoldiers,
                        sourceRow:-1,
                        sourceCol:-1,
                        status:'',
                        curPlayer: this.state.curPlayer==='white' ? 'black':'white'
                    })
                }
                else {
                    this.setState({
                        status: 'Invalid move. either move not possible or path not empty'
                    })
                }
            }
        }
    }

    isPathEmpty([sourceRow,sourceCol],[destRow,destCol]) {
        let piece=this.state.squares[sourceRow][sourceCol];
        let path = piece.getSrcToDestPath([sourceRow,sourceCol],[destRow,destCol]);
        for (let space of path) {
            if (!space) {
                return false;
            }
        }
        return true;
    }

    render() {
        return (
            <div className="game">
                <Board squares={this.state.squares}
                       onClick={(i,j) => this.handleClick(i,j)}/>
                <div className="game-info">
                    <h3>Turn</h3>
                    <div id="player-turn-box"
                          style={{backgroundColor :
                              this.state.curPlayer==='white' ? "#fff" : "#000"
                          }}/>
                    <div className="status">{this.state.status}</div>
                    <FallenSoldierBlock whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                                        blackFallenSoldiers={this.state.blackFallenSoldiers}/>
                </div>
            </div>
        )
    }
}
