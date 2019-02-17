// pages/user-binding/user-binding.js
var app = getApp();
var api = require('../../api.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        second: 60,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var page = this;
        app.request({
            url: api.user.sms_setting,
            method: 'get',
            data: {
                page: 1,
            },
            success: function (res) {
                if (res.code == 0) {
                    page.setData({
                        status: true,
                    });
                } else {
                    page.setData({
                        status: false,
                    });
                }
            },
        });
    },
    
    getPhoneNumber: function (e) {
        var page = this;
        if (e.detail.errMsg == 'getPhoneNumber:fail user deny') {
            wx.showModal({
                title: '提示',
                showCancel: false,
                content: '未授权',
                success: function (res) { }
            })
        } else {
            wx.login({
                success: function (res) {
                    if (res.code) {
                        var code = res.code;
                        app.request({
                            url: api.user.user_binding,
                            method: 'POST',
                            data: {
                                iv: e.detail.iv,
                                encryptedData: e.detail.encryptedData,
                                code: code,
                            },
                            success: function (res) {
                                if (res.code == 0) {
                                    page.setData({
                                        PhoneNumber: res.data.dataObj,
                                    });
                                } else {
                                    wx.showToast({
                                        title: '授权失败,请重试'
                                    });
                                }
                            },
                        });
                    } else {
                        wx.showToast({
                            title: '获取用户登录态失败！' + res.errMsg,
                            image: "/images/icon-warning.png",
                        });
                    }
                },
            });
        }
    },
    gainPhone: function () {
        this.setData({
            gainPhone: true,
            handPhone: false,
        });
    },
    handPhone: function () {
        this.setData({
            gainPhone: false,
            handPhone: true,
        });
    },

    nextStep: function () {
        var page = this;
        var phone = this.data.handphone;
        if (phone.length != 11) {
            wx.showToast({
                title: '手机号码错误',
                image: "/images/icon-warning.png",
            });
            return
        }

        app.request({
            url: api.user.user_hand_binding,
            method: 'POST',
            data: {
                content: phone,
            },
            success: function (res) {
                if (res.code == 0) {
                    page.timer()
                    page.setData({
                        content: res.msg,
                        timer: true,
                    })
                } else if (res.code == 2) {
                    wx.showToast({
                        title: res.msg,
                        image: "/images/icon-warning.png",
                    });
                } else {
                    wx.showToast({
                        title: res.msg,
                        image: "/images/icon-warning.png",
                    });
                }
            },
        });
    },
    timer: function () {
        let promise = new Promise((resolve, reject) => {
            let setTimer = setInterval(
                () => {
                    this.setData({
                        second: this.data.second - 1
                    })
                    if (this.data.second <= 0) {
                        this.setData({
                            timer: false,
                        })
                        resolve(setTimer)
                    }
                }, 1000)
        })
        promise.then((setTimer) => {
            clearInterval(setTimer)
        })
    },

    HandPhoneInput: function (e) {
        this.setData({
            handphone: e.detail.value
        })
    },
    CodeInput: function (e) {
        this.setData({
            code: e.detail.value
        })
    },
    PhoneInput: function (e) {
        this.setData({
            phoneNum: e.detail.value
        })
    },

    onSubmit: function () {
        var gainPhone = this.data.gainPhone;
        var handPhone = this.data.handPhone;
        if (gainPhone) {
            var phoneNum = this.data.phoneNum;
            if (phoneNum) {
                if (phoneNum.length != 11) {
                    wx.showToast({
                        title: '手机号码错误',
                        image: "/images/icon-warning.png",
                    });
                    return
                }
                var phone = phoneNum;
            } else {
                var phone = this.data.PhoneNumber;
                if (!phone) {
                    wx.showToast({
                        title: '手机号码错误',
                        image: "/images/icon-warning.png",
                    });
                    return
                }
            }
        } else {
            var phone = this.data.handphone;

            if (phone.length != 11) {
                wx.showToast({
                    title: '手机号码错误',
                    image: "/images/icon-warning.png",
                });
                return
            }
            var code = this.data.code;
            if (!code) {
                wx.showToast({
                    title: '请输入验证码',
                    image: "/images/icon-warning.png",
                });
                return
            }
            if (code != this.data.content) {
                wx.showToast({
                    title: '验证码错误',
                    image: "/images/icon-warning.png",
                });
                return
            }
        }
        var page = this;
        app.request({
            url: api.user.user_empower,
            method: 'POST',
            data: {
                phone: phone,
            },
            success: function (res) {
                if (res.code == 0) {
                    page.setData({
                        binding: true,
                        binding_num: phone
                    })
                } else if (res.code == 1){
                    wx.showToast({
                        title: res.msg,
                        image: "/images/icon-warning.png",
                    });
                }
            },
        })
    },
    renewal: function () {
        var page = this;
        page.setData({
            binding: false,
            gainPhone: true,
            handPhone: false,
        });

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var page = this;
        app.request({
            url: api.user.index,
            method: 'GET',
            success: function (res) {
                if (res.code == 0) {
                    if (res.data.user_info.binding) {
                        page.setData({
                            binding_num: res.data.user_info.binding,
                            binding: true
                        });
                    } else {
                        page.setData({
                            gainPhone: true,
                            handPhone: false,
                        });
                    }
                }
            }
        });

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },


    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})