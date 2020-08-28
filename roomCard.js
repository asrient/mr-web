import $ from "jquery";
import React, { Component } from "react";
import { UserLink } from "./user.js";
import { Link, Route } from "wouter";
import css from "./roomCard.css";

class RoomCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    componentDidMount() {

    }
    getCircle() {

    }
    gethero() {

    }
    gettxt() {
        var members_count = this.props.members_count
        var member_friends = []
        this.props.member_friends.forEach((friend, index) => {
            if (index < 3) {
                member_friends.push(friend)
            }
        })
        var txt = []
        var othersCount = members_count - member_friends.length
        member_friends.forEach((friend, index) => {
            if (index) {
                if (index == member_friends.length - 1 && othersCount == 0) {
                    txt.push(" and ")
                }
                else {
                    txt.push(", ")
                }
            }
            friend.key = friend.user_id
            txt.push(<UserLink {...friend} className="ink-light" />)
        });

        if (othersCount) {
            txt.push(" and ")
            var t = ' other'
            if (othersCount > 1) {
                t = t + 's'
            }
            txt.push(<Link key="others" href={'/roomPreview/' + this.props.room_id}>{othersCount + t}</Link>)
        }
        return txt
    }
    render() {
        return (<div className={css.container}>
            <div className={css.hero}></div>
            <div className={css.txt + " ink-grey size-xs base-semilight"}>{this.gettxt()}</div>
            <div className="center">
                <Link href={'/roomPreview/' + this.props.room_id} className={css.joinbutt + " center"}>Join</Link>
            </div>
        </div>)
    }
}

export default RoomCard;