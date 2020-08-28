import $ from "jquery";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import Rooms from "./rooms.js";
import RoomPreview from "./roomPreview.js";
import AddTracks from "./addTracks.js";
import RoomAccess from "./roomAccess.js";
import Profile from "./profile.js";
import { Switch, Route, Redirect } from "wouter";
import "./styles.css";
import state from "./state.js";

window.api = new window.Api()
window.state = state;
window.state.init();

class LoginRequired extends React.Component {
    constructor(props) {
        super(props);
        this.state = { isLoggedin: state.getState().is_loggedin }
    }
    componentDidMount() {
        if (!this.state.isLoggedin) {
            window.location.href = '/login'
        }
    }

    render() {
        if (this.state.isLoggedin)
            return (this.props.children)
        else
            return (<div>Redirecting..</div>)
    }
}

var RoomRequired = (prams) => {
    if (state.getState().room) {
        return prams.children
    }
    else {
        return (<Redirect to='/rooms' />)
    }
}

ReactDOM.render(
    <Switch>
        <Route path="/rooms"><Rooms /></Route>
        <Route path="/createRoom">
            <LoginRequired>
                <AddTracks action="create-room" />
            </LoginRequired>
        </Route>
        <Route path="/room/addTracks">
            <LoginRequired>
                <RoomRequired>
                    <AddTracks action="add-tracks" />
                </RoomRequired>
            </LoginRequired>
        </Route>
        <Route path="/room/access">
            <LoginRequired>
                <RoomRequired>
                    <RoomAccess />
                </RoomRequired>
            </LoginRequired>
        </Route>
        <Route path="/room/members">
            <LoginRequired>
                <RoomRequired>
                    {params => {
                        return (<RoomPreview room_id={state.getState().room.room_id} />)
                    }}
                </RoomRequired>
            </LoginRequired>
        </Route>
        <Route path="/profile/:id">
            {params => {
                if (state.getState().me.user_id != params.id)
                    return (<LoginRequired>
                        <Profile user_id={params.id} />
                    </LoginRequired>)
                else
                    return (<div>Account - not implemented yet</div>)
            }}</Route>
        <Route path="/roomPreview/:id">
            {params => {
                return (<LoginRequired>
                    <RoomPreview room_id={params.id} />
                </LoginRequired>)
            }}
        </Route>
        <Route>404, Not Found!</Route>
    </Switch>
    , document.getElementById('root')
);


