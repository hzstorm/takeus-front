/**
 * @link http://www.zjhejiang.com/
 * @copyright Copyright (c) 2018 浙江禾匠信息科技有限公司
 * @author Lu Wei
 *
 * Created by IntelliJ IDEA.
 * User: luwei
 * Date: 2018/5/11
 * Time: 18:38
 */

module.exports = function (object) {
    if (!object.data)
        object.data = {};
    var access_token = wx.getStorageSync("access_token");
    if (access_token) {
        object.data.access_token = access_token;
    }
    object.data._uniacid = this.siteInfo.uniacid;
    object.data._acid = this.siteInfo.acid;
    wx.request({
        url: object.url,
        header: object.header || {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: object.data || {},
        method: object.method || "GET",
        dataType: object.dataType || "json",
        success: function (res) {
            if (res.data.code == -1) {
                getApp().login();
            } else {
                if (object.success)
                    object.success(res.data);
            }
        },
        fail: function (res) {
            console.warn('--- request fail >>>');
            console.warn(res);
            console.warn('<<< request fail ---');
            var app = getApp();
            if (app.is_on_launch) {
                app.is_on_launch = false;
                wx.showModal({
                    title: "网络请求出错",
                    content: res.errMsg,
                    showCancel: false,
                    success: function (res) {
                        if (res.confirm) {
                            if (object.fail)
                                object.fail(res);
                        }
                    }
                });
            } else {
                wx.showToast({
                    title: res.errMsg,
                    image: "/images/icon-warning.png",
                });
                if (object.fail)
                    object.fail(res);
            }
        },
        complete: function (res) {
            if (res.statusCode != 200) {
                if (res.data.code && res.data.code == 500) {
                    wx.showModal({
                        title: '系统错误',
                        content: res.data.data.type + "\r\n事件ID:" + res.data.data.event_id,
                        cancelText: '关闭',
                        confirmText: '复制',
                        success: function (e) {
                            if (e.confirm) {
                                wx.setClipboardData({
                                    data: res.data.data.type + "\r\n事件ID:" + res.data.data.event_id + "\r\n " + object.url,
                                });
                            }
                        },
                    });
                }
                console.log('--- request http error >>>');
                console.log(res.statusCode);
                console.log(res.data);
                console.log('<<< request http error ---');
            }
            if (object.complete)
                object.complete(res);
        }
    });
};