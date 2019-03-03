import React, {Component} from 'react';
import Square from './square';
import '../index.css';

export default class Board extends Component {
    constructor(props) {
        super(props);
        this.renderSquare = this.renderSquare.bind(this);
    }

    renderSquare(i,j,squareShade) {
        return (
            <Square key={i*8+j}
                    shade={squareShade}
                    style={this.props.squares[i][j] ? this.props.squares[i][j].style : null}
                    piece={this.props.squares[i][j]}
                    onClick={()=>this.props.onClick(i,j)}>
            </Square>
        )
    }

    render() {
        let squares=this.props.squares;
        let rows=[];
        for (let i=0; i< squares.length;i++) {
            //if (i+j)%2===0 => i and j both even or both odd => light square
            //if (i+j)%2!===0 => i and j one odd and one even => dark square
            rows.push(
                <div key={i} className="board-row">
                    {squares[i].map((value,j)=>
                        this.renderSquare(i,j,(i+j)%2===0 ? 'light-square':'dark-square')
                    )}
                </div>
            )
        }
        return (
            <div>
                {rows}
            </div>
        )
    }
}