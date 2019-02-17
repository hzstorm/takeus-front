//app.js
var util = require('./utils/utils.js');
var api;
var order_pay = require('./commons/order-pay/order-pay.js');
App({
    is_on_launch: true,
    onLaunch: function () {
        this.setApi();
        api = this.api;

        this.getNavigationBarColor();
        console.log(wx.getSystemInfoSync());
        this.getStoreData();
        this.getCatList();
    },

    getStoreData: function () {
        var page = this;
        this.request({
            url: api.default.store,
            success: function (res) {
                if (res.code == 0) {
                    wx.setStorageSync("store", res.data.store);
                    wx.setStorageSync("store_name", res.data.store_name);
                    wx.setStorageSync("show_customer_service", res.data.show_customer_service);
                    wx.setStorageSync("contact_tel", res.data.contact_tel);
                    wx.setStorageSync("share_setting", res.data.share_setting);
                }
            },
            complete: function () {
                //page.login();
            }
        });
    },

    getCatList: function () {
        this.request({
            url: api.default.cat_list,
            success: function (res) {
                if (res.code == 0) {
                    var cat_list = res.data.list || [];
                    wx.setStorageSync("cat_list", cat_list);
                }
            }
        });
    },
    login: require('utils/login.js'),
    request: require('utils/request.js'),
    saveFormId: function (form_id) {
        this.request({
            url: api.user.save_form_id,
            data: {
                form_id: form_id,
            }
        });
    },

    loginBindParent: function (object) {
        var access_token = wx.getStorageSync("access_token");
        if (access_token == '') {
            return true;
        }
        getApp().bindParent(object);
    },
    bindParent: function (object) {
        if (object.parent_id == "undefined" || object.parent_id == 0)
            return;
        console.log("Try To Bind Parent With User Id:" + object.parent_id);
        var user_info = wx.getStorageSync("user_info");
        var share_setting = wx.getStorageSync("share_setting");
        if (share_setting.level > 0) {
            var parent_id = object.parent_id;
            if (parent_id != 0) {
                getApp().request({
                    url: api.share.bind_parent,
                    data: { parent_id: object.parent_id },
                    success: function (res) {
                        if (res.code == 0) {
                            user_info.parent = res.data
                            wx.setStorageSync('user_info', user_info);
                        }
                    }
                });
            }
        }
    },

    /**
     * 分享送优惠券
     * */
    shareSendCoupon: function (page) {
        wx.showLoading({
            mask: true,
        });
        if (!page.hideGetCoupon) {
            page.hideGetCoupon = function (e) {
                var url = e.currentTarget.dataset.url || false;
                page.setData({
                    get_coupon_list: null,
                });
                if (url) {
                    wx.navigateTo({
                        url: url,
                    });
                }
            };
        }
        this.request({
            url: api.coupon.share_send,
            success: function (res) {
                if (res.code == 0) {
                    page.setData({
                        get_coupon_list: res.data.list
                    });
                }
            },
            complete: function () {
                wx.hideLoading();
            }
        });
    },
    getauth: function (object) {
        wx.showModal({
            title: '是否打开设置页面重新授权',
            content: object.content,
            confirmText: '去设置',
            success: function (e) {
                if (e.confirm) {
                    wx.openSetting({
                        success: function (res) {
                            if (object.success) {
                                object.success(res);
                            }
                        },
                        fail: function (res) {
                            if (object.fail) {
                                object.fail(res);
                            }
                        },
                        complete: function (res) {
                            if (object.complete)
                                object.complete(res);
                        }
                    })
                } else {
                    if (object.cancel) {
                        getApp().getauth(object);
                    }
                }
            }
        })
    },
    api: require('api.js'),
    setApi: function () {
        var siteroot = this.siteInfo.siteroot;
        siteroot = siteroot.replace('app/index.php', '');
        siteroot += 'addons/zjhj_mall/core/web/index.php?store_id=-1&r=api/';

        function getNewApiUri(api) {
            for (var i in api) {
                if (typeof api[i] === 'string') {
                    api[i] = api[i].replace('{$_api_root}', siteroot);
                } else {
                    api[i] = getNewApiUri(api[i]);
                }
            }
            return api;
        }

        this.api = getNewApiUri(this.api);
        var _index_api_url = this.api.default.index;
        var _web_root = _index_api_url.substr(0, _index_api_url.indexOf('/index.php'));
        this.webRoot = _web_root;
    },
    webRoot: null,
    siteInfo: require('siteinfo.js'),
    currentPage: null,
    pageOnLoad: function (page) {
        this.page.onLoad(page);
    },
    pageOnReady: function (page) {
        this.page.onReady(page);
    },
    pageOnShow: function (page) {
        this.page.onShow(page);

    },
    pageOnHide: function (page) {
        this.page.onHide(page);

    },
    pageOnUnload: function (page) {
        this.page.onUnload(page);

    },
    page: require('utils/page.js'),

    getNavigationBarColor: function () {
        var app = this;
        app.request({
            url: api.default.navigation_bar_color,
            success: function (res) {
                if (res.code == 0) {
                    wx.setStorageSync('_navigation_bar_color', res.data);
                    app.setNavigationBarColor();
                }
            }
        });
    },

    setNavigationBarColor: function () {
        var navigation_bar_color = wx.getStorageSync('_navigation_bar_color');
        if (navigation_bar_color) {
            wx.setNavigationBarColor(navigation_bar_color);
        }
    },

    //登录成功后不刷新的页面
    loginNoRefreshPage: [
        'pages/index/index',
        'mch/shop/shop',
        //'pages/fxhb/open/open',
        //'pages/fxhb/detail/detail',
    ],


    openWxapp: function (e) {
        console.log('--openWxapp---');
        if (!e.currentTarget.dataset.url)
            return;
        var url = e.currentTarget.dataset.url;
        url = parseQueryString(url);
        url.path = url.path ? decodeURIComponent(url.path) : "";
        console.log("Open New App");
        console.log(url);
        wx.navigateToMiniProgram({
            appId: url.appId,
            path: url.path,
            complete: function (e) {
                console.log(e);
            }
        });

        function parseQueryString(url) {
            var reg_url = /^[^\?]+\?([\w\W]+)$/,
                reg_para = /([^&=]+)=([\w\W]*?)(&|$|#)/g,
                arr_url = reg_url.exec(url),
                ret = {};
            if (arr_url && arr_url[1]) {
                var str_para = arr_url[1], result;
                while ((result = reg_para.exec(str_para)) != null) {
                    ret[result[1]] = result[2];
                }
            }
            return ret;
        }
    },
    uploader: require('utils/uploader'),
    navigatorClick: function (e, page) {
        var open_type = e.currentTarget.dataset.open_type;
        if (open_type == 'redirect') {
            return true;
        }
        if (open_type == 'wxapp') {
            var path = e.currentTarget.dataset.path;
            var str = path.substr(0, 1);
            if (str != '/') {
                path = '/' + path;
            }
            wx.navigateToMiniProgram({
                appId: e.currentTarget.dataset.appid,
                path: path,
                complete: function (e) {
                    console.log(e);
                }
            });
        }
        if (open_type == 'tel') {
            var contact_tel = e.currentTarget.dataset.tel;
            wx.makePhoneCall({
                phoneNumber: contact_tel
            })
        }
        return false;

        function parseQueryString(url) {
            var reg_url = /^[^\?]+\?([\w\W]+)$/,
                reg_para = /([^&=]+)=([\w\W]*?)(&|$|#)/g,
                arr_url = reg_url.exec(url),
                ret = {};
            if (arr_url && arr_url[1]) {
                var str_para = arr_url[1], result;
                while ((result = reg_para.exec(str_para)) != null) {
                    ret[result[1]] = result[2];
                }
            }
            return ret;
        }
    },
    utils: util,
    order_pay: order_pay,
});