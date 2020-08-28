import $ from "jquery";
import React, { Component } from "react";
import Header from "./header.js";
import { TrackItem } from "./track.js";
import { Link, Redirect } from "wouter";
import css from "./room.css";
import sharedCss from "./common.css";

class Queue extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tracks: null, currentTrack: null }
    }
    componentDidMount() {
        this.parseState();
        this.unsub = window.state.subscribe(() => {
            this.parseState();
        })
    }
    parseState() {
        var st = window.state.getState();
        if (st.room) {
            this.setState({ ...this.state, tracks: st.room.tracks, currentTrack: st.room.current_roomtrack })
        }
    }
    componentWillUnmount() {
        this.unsub();
    }
    list() {
        if (this.state.tracks) {
            var tracks = this.state.tracks
            var currentTrack = this.state.currentTrack
            var arranged = []
            var currInd = tracks.findIndex((track) => { return track.roomtrack_id == currentTrack.roomtrack_id })
            if (currInd != undefined) {
                var counter = currInd;
                for (var i = 0; i < tracks.length; i++) {
                    if (counter >= tracks.length) {
                        counter = 0
                    }
                    if (counter != currInd) {
                        arranged.push(tracks[counter])
                    }
                    counter++;
                }
            }
            else {
                console.error('current track not found in tracks')
                arranged = tracks
            }
            var list = []
            arranged.forEach(track => {
                list.push(<TrackItem key={track.roomtrack_id} {...track} >
                    <div className={css.delButt + ' center'} onClick={() => {
                        window.state.removeTrack(track.roomtrack_id)
                    }}>
                        <img className={"icon " + css.trashIcon} src="/static/icons/trash.png" />
                    </div>
                </TrackItem>)
            });
            if (list.length)
                return list
            else
                return (<div></div>)
        }
        else {
            return (<div>Loading tracks..</div>)
        }
    }
    render() {
        if (this.state.exit)
            return (<Redirect to='/rooms' />)
        else
            return (<div>
                {this.list()}
                <div className="center-col" style={{ padding: '1.3rem 0.3rem' }}>
                    <div style={{ paddingTop: '0.6rem' }} className="center">
                        <Link href='/room/addTracks' className={sharedCss.redButt_s+' center'}>Add more</Link>
                    </div>
                </div>
                <br/>
                </div>)
    }
}

class Room extends React.Component {
    constructor(props) {
        super(props);
        this.state = { room: null, exit: false }
    }
    componentDidMount() {
        this.parseState();
        this.unsub = window.state.subscribe(() => {
            this.parseState();
        })
    }
    parseState() {
        var st = window.state.getState();
        if (st.room) {
            this.setState({ ...this.state, room: st.room })
        }
        else
            this.setState({ ...this.state, exit: true })
    }
    componentWillUnmount() {
        this.unsub();
    }
    player() {
        if (this.state.room) {
            return (<TrackItem playing {...this.state.room.current_roomtrack} />)
        }
        else {
            return (<div>loading..</div>)
        }
    }
    playButton(){
        if (this.state.room) {
            if(this.state.room.is_paused){
                return(<div className={css.playCircle+" center"}>
                <img className={"icon clickable"} src="/static/icons/play.png" /> 
             </div>)
            }
            else{
                return(<div className={css.playCircle+" center"}>
                <img className={"icon clickable"} src="/static/icons/pause.png" /> 
             </div>)
            }
        }
        else {
            return (<div>..</div>)
        }
    }
    render() {
        if (this.state.exit)
            return (<Redirect to='/rooms' />)
        else
            return (<>
                <Header roomControls />
                <div id={css.main}>
                    <div id={css.p1}>
                        room
                    </div>
                    <div id={css.p2} className="container">
                        <div id={css.player}>
                            {this.player()}
                            <div className="center">
                            {this.playButton()}
                            </div>
                        </div>
                        <br />
                        <div style={{ paddingLeft: '2rem', paddingBottom: '0.6rem' }}
                            className='container size-m ink-light base-semibold'>
                            Up next
                            </div>
                        <Queue />
                    </div>

                </div>
            </>)
    }
}

export default Room;