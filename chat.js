import $ from "jquery";
import React, { Component } from "react";
import css from "./chat.css";
import Header from "./header.js";
import ChatBar from "./chatBar.js";
import { Link, Redirect } from "wouter";
import { UserCircle } from "./user.js";

function formatTime(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = { messages: null, typing: [], exit: false }
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
            var typing = []
            if (st.room.members) {
                var users = st.room.members.friends.concat(st.room.members.others)
                Object.keys(st.typingUsers).forEach(userId => {
                    var user = users.find((user) => { return user.user_id == userId })
                    if (user != undefined) {
                        typing.push(user)
                    }
                });
            }
            var msgs = [...st.messages]
            msgs.reverse()
            this.setState({ ...this.state, messages: msgs, typing })
        }
        else
            this.setState({ ...this.state, exit: true })
    }
    componentWillUnmount() {
        this.unsub();
    }
    message(key, from, date, txt) {
        return (<div key={key} className={css.chat}>
            <div className={css.avatarBox}>
                <UserCircle nopopup {...from} size='2.5rem' style={{ margin: '0px' }} />
            </div>
            <div className={css.text}>
                <div className={css.chatTitle}>
                    {from.name}
                    <span className={css.chatTime}>{formatTime(new Date(date * 1000))}</span>
                </div>
                <div>{txt}</div>
            </div>
        </div>)
    }
    chats() {
        if (this.state.messages) {
            var list = []
            this.state.messages.forEach(chat => {
                list.push(this.message(chat.key, chat.from, chat.date, chat.text))
            });
            return (<div className={'container ' + css.container}>
                {this.typingText()}
                {list}
            </div>)
        }
        else {
            return (<div style={{ padding: '3rem 1rem' }} className="center">
                Loading..
            </div>)
        }
    }
    typingText() {
        var st=window.state.getState()
        var txt=''
        var count=0
        this.state.typing.forEach((user)=>{
            if(count<3&&user.user_id!=st.me.user_id){
                if(count)
               txt+=', '+user.name 
               else
               txt=user.name
               count++
            }
            
        })
        if(txt.length){
            txt+=' is typing..'
            return(<div className={css.chatTyping}>{txt}</div>)
        }
    }
    render() {
        if (this.state.exit)
            return (<Redirect to='/rooms' />)
        else
            return (<>
                <Header roomControls />
                {this.chats()}
                <ChatBar scrollBottom />
            </>)
    }
}

export default Chat