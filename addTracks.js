import $ from "jquery";
import React, { Component } from "react";
import Header from "./header.js";
import { TrackItem } from "./track.js";
import { SelectButton } from "./global.js";
import { Link, Redirect } from "wouter";
import css from "./addTracks.css";

class AddTracks extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tracks: null, selected: [], wait: false, done: false }
    }
    load() {
        api.get('tracks', null, (status, data) => {
            if (status == 200) {
                this.setState({ ...this.state, tracks: data.tracks })
            }
            else {
                console.error(status, data)
            }
        })
    }
    componentDidMount() {
        this.load()
    }
    tracks() {
        if (this.state.tracks) {
            var list = []
            this.state.tracks.forEach(track => {
                var isSel = this.state.selected.includes(track.track_id)
                list.push(<TrackItem key={track.track_id} {...track}>
                    <SelectButton selected={isSel} onClick={() => {
                        var isSel = this.state.selected.includes(track.track_id)
                        var selected = this.state.selected
                        if (!isSel) {
                            selected.push(track.track_id)
                        }
                        else {
                            var ind = selected.findIndex((id) => { return id == track.track_id })
                            selected.splice(ind, 1);
                        }
                        this.setState({ ...this.state, selected })
                    }} />
                </TrackItem>)
            });
            return (<div>{list}</div>)
        }
        else {
            return (<div className="center ink-white size-m" style={{ padding: '2rem 1rem' }}>Loading..</div>)
        }
    }
    next = () => {
        if (!this.state.wait) {
            if (this.props.action == 'create-room') {
                this.setState({ ...this.state, wait: true })
                window.state.createRoom(this.state.selected, (res) => {
                    this.setState({ ...this.state, wait: false, done: true })
                });
            }
            else {
                api.post('room/tracks/add' + type, { track_ids: this.state.selected }, (status, data) => {
                    if (status == 201) {
                        this.setState({ ...this.state, wait: false, done: true })
                    }
                    else {
                        console.error(status, data)
                        if (status == 400) {
                            this.setState({ ...this.state, wait: false, selected: [] })
                        }
                    }
                })
            }
        }
    }
    opt() {
        var txt = 'Done'
        if (this.state.wait) {
            txt = 'Saving..'
        }
        if (this.state.selected.length) {
            return (<>
                <div style={{ height: '6rem' }}></div>
                <div id={css.buttContainer} className="center">
                    <div className='redButt center' onClick={this.next}>{txt}</div>
                </div>
            </>)
        }
        else {
            return (<div></div>)
        }
    }
    render() {
        if (this.state.done)
            return (<Redirect to="/room" />)
        else
            return (<>
                <Header blank />
                <div className="container" style={{ padding: '1rem 0.5rem' }}>
                    <div className="ink-white base-regular size-xxl">
                        Pick your music
                </div>
                    <br />
                    {this.tracks()}
                    <br />
                    {this.opt()}
                </div>
            </>)
    }
}

export default AddTracks;