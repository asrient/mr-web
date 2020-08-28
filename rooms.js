import $ from "jquery";
import React, { Component } from "react";
import Header from "./header.js";
import RoomCard from "./roomCard.js";
import { Link, Route } from "wouter";
import css from "./rooms.css";

class Rooms extends React.Component {
    constructor(props) {
        super(props);
        this.state = { rooms: null }
    }
    componentDidMount() {
        this.parseState();
        this.unsub = window.state.subscribe(() => {
            this.parseState();
        })

        api.get('rooms', null, (status, data) => {
            if (status == 200) {
                /*data.rooms = [
                    { "room_id": 5, "members_count": 2, "member_friends": [{ "user_id": 1, "name": "Aritra Sen" }] },
                    { "room_id": 6, "members_count": 2, "member_friends": [{ "user_id": 1, "name": "Aritra Sen" },{ "user_id": 4, "name": "Someone Unknown" }] },
                    { "room_id": 7, "members_count": 5, "member_friends": [{ "user_id": 1, "name": "Aritra Sen" }] },
                ]*/
                this.setState({ ...this.state, rooms: data.rooms })
            }
            else {
                console.error(status, data)
            }
        })
    }
    parseState() {
        var st = window.state.getState();
        //this.setState({ ...this.state, avatar: st.info.icon })
    }
    componentWillUnmount() {
        this.unsub();
    }
    roomCards() {
        var list = []
        this.state.rooms.forEach(room => {
            list.push(<div key={room.room_id} className={css.item + " center"}><RoomCard {...room} /></div>)
        });
        return list
    }
    showRooms() {
        if (this.state.rooms != null) {
            if (this.state.rooms.length) {
                return (<div id={css.grid}>{this.roomCards()}</div>)
            }
            else {
                return (<div className="center size-m base-regular" style={{ padding: '5rem 2rem' }}>
                    Add more friends to get started!
                </div>)
            }
        }
        else {
            return (<div className="center size-m base-regular" style={{ height: '10rem' }}>
                Loading
            </div>)
        }
    }
    render() {
        return (<>
            <Header />
            <div id={css.createSec} className="container center-col">
                <div className="size-xl ink-white baser-regular">Create your own room</div>
                <br/>
                <Link href="/createRoom" className="redButt center">Add songs</Link>
            </div>
            {this.showRooms()}
        </>)
    }
}

export default Rooms;