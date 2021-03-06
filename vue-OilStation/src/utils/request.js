import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 50000000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      //config.headers['X-Token'] = getToken()
      //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      config.headers['Authorization'] = "Bearer " + getToken();
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data
    console.log(res)
    if (res.code == 200 && res.message != "") {
      Message({
        message: res.message,
        type: 'success'
      })
    }
    // if(res.code==403){
    //   MessageBox.confirm('您没有权限访问此页面', '确认', {
    //     confirmButtonText: '退出',
    //     cancelButtonText: '取消',
    //     type: 'warning'
    //   }).then(() => {
    //     store.dispatch('user/logout').then(() => {
    //       location.reload()
    //     })
    //   })
    // }

    // if the custom code is not 20000, it is judged as an error.
    if (res.code !== 200) {
      console.log("Un200Error---" + res)
      Message({
        message: res.message || 'Un200Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        // to re-login
        MessageBox.confirm('您已被注销，您可以选择取消以停留在此页，或重新登录', '确认注销', {
          confirmButtonText: '退出',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    //error.message.substring(32,35) == "403"
    if (error.response.status == 403) {
      Message({
        message: "您并无此权限",
        type: 'error'
      })
      return Promise.reject(error)
    } else if (error.response.status == 401) {
      return store
        .dispatch("user/refreshToken", getToken())
        .then(() => {
          // Message({
          //   message: "令牌刷新成功",
          //   type: 'success',
          //   duration: 5 * 1000
          // })
          //error.config.isRetryRequest = true;
          //error.config.headers.Authorization = 'Bearer ' + getToken();
          return service(error.config);
        })
        .catch(() => {
          Message({
            message: error.message,
            type: 'error',
            duration: 5 * 1000
          })
          return Promise.reject(error)
        });
    }
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
