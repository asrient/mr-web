import $ from "jquery";
import React, { Component } from "react";
import Header from "./header.js";
import { Link, Route } from "wouter";
import css from  "./user.css";

class UserLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = { }
    }
    render() {
    return (<Link href={"/profile/"+this.props.user_id} className={css.link+' '+this.props.className+' trunc'}>{this.props.name}</Link>)
    }
}

class UserItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = { }
    }
    render() {
    return (<div className={css.userContainer}>
        <div className={css.content}>
        <div>
            <Link href={"/profile/"+this.props.user_id}>
                <div className={css.avatar}></div>
                </Link> 
        </div>
        <div>
            <Link href={"/profile/"+this.props.user_id} className={css.userName+" ink-white base-semilight trunc"}>{this.props.name}</Link> 
        </div>
        </div>
     <div>{this.props.children}</div>
        </div>)
    }
}

export {UserLink,UserItem};