var api = require('../../api.js');
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.pageOnLoad(this);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        app.pageOnReady(this);
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        app.pageOnShow(this);
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        app.pageOnHide(this);
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        app.pageOnUnload(this);
    },

    getUserInfo: function (res) {
        console.log('getUserInfo---------->', res);
        if (res.detail.errMsg != 'getUserInfo:ok') {
            return;
        }
        wx.showLoading({
            title: "正在登录",
            mask: true,
        });
        wx.login({
            success: function (login_res) {
                var code = login_res.code;
                getApp().request({
                    url: api.passport.login,
                    method: 'POST',
                    data: {
                        code: code,
                        user_info: res.detail.rawData,
                        encrypted_data: res.detail.encryptedData,
                        iv: res.detail.iv,
                        signature: res.detail.signature
                    },
                    success: function (res) {
                        if (res.code == 0) {
                            wx.setStorageSync("access_token", res.data.access_token);
                            wx.setStorageSync("user_info", res.data);
                            var login_pre_page = wx.getStorageSync('login_pre_page');
                            if (!login_pre_page || !login_pre_page.route) {
                                wx.redirectTo({
                                    url: '/pages/index/index',
                                });
                            }
                            var parent_id = 0;
                            if (login_pre_page.options && login_pre_page.options.user_id) {
                                parent_id = login_pre_page.options.user_id;
                            } else if (login_pre_page.options && login_pre_page.options.scene) {
                                parent_id = login_pre_page.options.scene;
                            } else {
                                parent_id = wx.getStorageSync('parent_id');
                            }
                            if (parent_id && parent_id != 0) {
                                getApp().bindParent({
                                    parent_id: parent_id,
                                });
                            }
                            wx.redirectTo({
                                url: '/' + login_pre_page.route + '?' + getApp().utils.objectToUrlParams(login_pre_page.options),
                            });

                        } else {
                            wx.showModal({
                                title: '提示',
                                content: res.msg,
                                showCancel: false,
                            });
                        }
                    },
                    complete: function () {
                        wx.hideLoading();
                    }
                });
            },
            fail: function (res) {
            },
        });

    },
});