import $ from "jquery";
import React, { Component } from "react";
import { Link, Route } from "wouter";

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() {
    }
    showOpts() {
        if (!this.props.blank) {
            if (!this.props.roomControls)
                return (<div id="hd_opts" className="hstack space-around">
                    <a className="hd_opt" href="/joinroom">Join room</a>
                    <Link className="hd_opt" href="/account">Account</Link>
                </div>)
            else
                return (<div id="hd_opts" className="hstack space-around">
                    <Link className="hd_opt" href="/room/access">Access</Link>
                    <div className="hd_opt red_opt" onClick={() => { window.state.leaveRoom() }}>
                        &nbsp;LEAVE&nbsp;
                    </div>
                </div>)
        }
        else {
            return (<div></div>)
        }

    }
    render() {
        return (<>
            <div id="header">
                <a id="hd_hero" href="/"><img id="hd_mrIcon" src="/static/icons/mr.png" /></a>
                {this.showOpts()}
            </div>
            <div id="hd_space"></div>
        </>)
    }
}

export default Header;