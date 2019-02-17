/**
 * @link http://www.zjhejiang.com/
 * @copyright Copyright (c) 2018 浙江禾匠信息科技有限公司
 * @author Lu Wei
 *
 * Created by IntelliJ IDEA.
 * User: luwei
 * Date: 2018/5/11
 * Time: 18:37
 */
module.exports = function (args) {
    var pages = getCurrentPages();
    if (pages.length) {
        var current_page = pages[pages.length - 1];
        if (current_page&&current_page.route != 'pages/login/login')
            wx.setStorageSync('login_pre_page', current_page);
    }
    wx.redirectTo({
        url: '/pages/login/login',
    });
    return;


    var api = getApp().api;
    var pages = getCurrentPages();
    var page = pages[(pages.length - 1)];
    wx.showLoading({
        title: "正在登录",
        mask: true,
    });
    wx.login({
        success: function (res) {
            if (res.code) {
                var code = res.code;
                wx.getUserInfo({
                    success: function (res) {
                        //console.log(res);
                        getApp().request({
                            url: api.passport.login,
                            method: "post",
                            data: {
                                code: code,
                                user_info: res.rawData,
                                encrypted_data: res.encryptedData,
                                iv: res.iv,
                                signature: res.signature
                            },
                            success: function (res) {
                                wx.hideLoading();
                                // console.log(code)
                                if (res.code == 0) {
                                    wx.setStorageSync("access_token", res.data.access_token);
                                    wx.setStorageSync("user_info", res.data);
                                    // console.log(res);
                                    // var parent_id = wx.getStorageSync("parent_id");
                                    var p = getCurrentPages();
                                    var parent_id = 0;
                                    if (p[0] && p[0].options.user_id != undefined) {
                                        var parent_id = p[0].options.user_id;
                                    }
                                    else if (p[0] && p[0].options.scene != undefined) {
                                        var parent_id = p[0].options.scene;
                                    }
                                    // console.log(parent_id, p[0].options.scene, p[0].options.user_id);
                                    getApp().bindParent({
                                        parent_id: parent_id || 0
                                    });

                                    if (page == undefined) {
                                        return;

                                    }
                                    var loginNoRefreshPage = getApp().loginNoRefreshPage;
                                    for (var i in loginNoRefreshPage) {
                                        if (loginNoRefreshPage[i] === page.route)
                                            return;
                                    }
                                    wx.redirectTo({
                                        url: "/" + page.route + "?" + util.objectToUrlParams(page.options),
                                        fail: function () {
                                            wx.switchTab({
                                                url: "/" + page.route,
                                            });
                                        },
                                    });
                                } else {
                                    wx.showToast({
                                        title: res.msg
                                    });
                                }
                            }
                        });
                    },
                    fail: function (res) {
                        wx.hideLoading();
                        getApp().getauth({
                            content: '需要获取您的用户信息授权，请到小程序设置中打开授权',
                            cancel: true,
                            success: function (e) {
                                if (e) {
                                    getApp().login();
                                }
                            },
                        });
                    }
                });
            } else {
                //console.log(res);
            }

        }
    });
};