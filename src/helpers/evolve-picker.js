import React, {Component} from 'react';

export default class EvolvePicker extends Component {
    constructor(props) {
        super(props);
        this.state= {
            value:'queen',
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({
            value: event.target.value,
        })
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.onSubmit(this.state.value);
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <label>Pick a type to evolve: &nbsp;
                    <select value={this.state.value} onChange={this.handleChange}>
                        <option value="queen">Queen</option>
                        <option value="rook">Rook</option>
                        <option value="knight">Knight</option>
                        <option value="bishop">Bishop</option>
                    </select>
                    <input type="submit" value="Submit"/>
                </label>
            </form>
        )
    }
}