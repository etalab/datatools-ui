import objectPath from 'object-path'

import {setErrorMessage} from './status'
import {secureFetch} from '../../common/actions'

export function checkingExistingLogin (loginProps) {
  return {
    type: 'CHECKING_EXISTING_LOGIN',
    loginProps
  }
}

export function noExistingLogin () {
  return {
    type: 'NO_EXISTING_LOGIN'
  }
}

export function userLoggedIn (token, id_token, profile) {
  return {
    type: 'USER_LOGGED_IN',
    token,
    id_token,
    profile
  }
}

export function revokeToken () {
  return {
    type: 'REVOKE_USER_TOKEN'
  }
}

export function checkExistingLogin (loginProps) {
  return function (dispatch, getState) {
    dispatch(checkingExistingLogin(loginProps))
    var login = getState().user.auth0.checkExistingLogin(loginProps)
    if (login) {
      return login.then((userTokenAndProfile) => {
        if (userTokenAndProfile) {
          dispatch(userLoggedIn(userTokenAndProfile.token,
                                userTokenAndProfile.id_token,
                                userTokenAndProfile.profile))
        } else {
          console.log('error checking token')
        }
      })
    } else {
      // no login found
      dispatch(noExistingLogin())
      // return empty promise
      return new Promise((resolve) => { resolve(null) })
    }
  }
}

// server call
export function fetchUser (user) {
  return function (dispatch, getState) {
    const url = '/api/manager/secure/user/' + user
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(user => {
        return user
      })
  }
}

function updatingUserMetadata (profile, props, payload) {
  return {
    type: 'UPDATING_USER_METADATA',
    profile,
    props,
    payload
  }
}

export function updateUserMetadata (profile, props) {
  return function (dispatch, getState) {
    const CLIENT_ID = process.env.AUTH0_CLIENT_ID

    const userMetadata = profile.user_metadata || {
      lang: 'en',
      datatools: [
        {
          client_id: CLIENT_ID
        }
      ]
    }
    const clientIndex = userMetadata.datatools.findIndex(d => d.client_id === CLIENT_ID)
    for (var key in props) {
      objectPath.set(userMetadata, `datatools.${clientIndex}.${key}`, props[key])
    }
    const payload = {user_metadata: userMetadata}
    dispatch(updatingUserMetadata(profile, props, payload))
    const url = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${profile.user_id}`
    return dispatch(secureFetch(url, 'PATCH', payload))
      .then(response => response.json())
      .then(user => {
        if (user.user_id === getState().user.profile.user_id) {
          dispatch(checkExistingLogin())
        }
        return user
      })
  }
}

export function removeUserSubscription (profile, subscriptionType) {
  return function (dispatch, getState) {
    const subscriptions = profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions || [{type: subscriptionType, target: []}]
    const index = subscriptions.findIndex(sub => sub.type === subscriptionType)
    if (index > -1) {
      subscriptions.splice(index, 1)
    } else {
      return
    }
    return dispatch(updateUserData(profile, {subscriptions: subscriptions}))
  }
}

export function updateTargetForSubscription (profile, target, subscriptionType) {
  return function (dispatch, getState) {
    const subscriptions = profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions || [{type: subscriptionType, target: []}]
    if (subscriptions.findIndex(sub => sub.type === subscriptionType) === -1) {
      subscriptions.push({type: subscriptionType, target: []})
    }
    for (var i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i]
      if (sub.type === subscriptionType) {
        const index = sub.target.indexOf(target)
        if (index > -1) {
          sub.target.splice(index, 1)
        } else {
          sub.target.push(target)
        }
      }
    }
    return dispatch(updateUserData(profile, {subscriptions: subscriptions}))
  }
}

export function unsubscribeAll (profile) {
  return function (dispatch, getState) {
    return dispatch(updateUserData(profile, {subscriptions: []}))
  }
}

// server call
export function updateUserData (user, userData) {
  return function (dispatch, getState) {
    var dtIndex = user.profile ? user.profile.app_metadata.datatools.findIndex(dt => dt.client_id === process.env.AUTH0_CLIENT_ID) : user.app_metadata.datatools.findIndex(dt => dt.client_id === process.env.AUTH0_CLIENT_ID)
    var datatools = user.profile ? user.profile.app_metadata.datatools : user.app_metadata.datatools
    if (dtIndex === -1) {
      return dispatch(setErrorMessage(`Could not find user metadata\n${JSON.stringify(user)}`))
    }
    for (var type in userData) {
      datatools[dtIndex][type] = userData[type]
    }
    var payload = {
      user_id: user.user_id,
      data: datatools
    }
    const url = '/api/manager/secure/user/' + user.user_id
    return dispatch(secureFetch(url, 'put', payload))
      .then(response => response.json())
      .then(user => {
        console.log(user)
        if (user.user_id === getState().user.profile.user_id) {
          dispatch(checkExistingLogin())
        }
        return user
      })
  }
}

// export function updateUserPermissions (user, permissions) {
//   return function (dispatch, getState) {
//     var payload = {
//       user_id: user.user_id,
//       data: permissions
//     }
//
//     return dispatch(secureFetch(url, 'put', payload))
//
//     }).done((data) => {
//       console.log('update user ok', data)
//       this.fetchUsers()
//     })
//   }
// }

export function creatingPublicUser () {
  return {
    type: 'CREATING_PUBLIC_USER'
  }
}

export function createdPublicUser (profile) {
  return {
    type: 'CREATED_PUBLIC_USER',
    profile
  }
}

// server call
export function createPublicUser (credentials) {
  return function (dispatch, getState) {
    dispatch(creatingPublicUser())
    console.log(credentials)
    const url = '/api/manager/public/user'
    return dispatch(secureFetch(url, 'post', credentials))
      .then(response => response.json())
      .then(profile => {
        return dispatch(createdPublicUser(profile))
      })
  }
}

export function login (user, lockOptions) {
  return function (dispatch, getState) {
      return getState().user.auth0.login(lockOptions)
  }
}

export function userLogout () {
  return {
    type: 'USER_LOGGED_OUT'
  }
}

export function logout () {
  return function (dispatch, getState) {
    dispatch(userLogout())
    getState().user.auth0.logout()
  }
}

// Recent Activity for User's Subscriptions

export function getRecentActivity (user) {
  return function (dispatch, getState) {
    const userId = user.profile.user_id
    const url = `/api/manager/secure/user/${userId}/recentactivity`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(activity => {
        return dispatch(receiveRecentActivity(activity))
      })
  }
}

function receiveRecentActivity (activity) {
  return {
    type: 'RECEIVE_USER_RECENT_ACTIVITY',
    activity
  }
}
