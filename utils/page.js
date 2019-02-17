/**
 * @link http://www.zjhejiang.com/
 * @copyright Copyright (c) 2018 浙江禾匠信息科技有限公司
 * @author Lu Wei
 *
 * Created by IntelliJ IDEA.
 * User: luwei
 * Date: 2018/5/11
 * Time: 18:32
 */
module.exports = {
    currentPage: null,
    onLoad: function (page) {
        console.log('--------pageOnLoad----------');
        this.currentPage = page;
        var _this = this;
        if (page.options) {
            var parent_id = 0;
            if (page.options.user_id) {
                parent_id = page.options.user_id;
            } else if (page.options.scene) {
                if (isNaN(page.options.scene)) {
                    var scene = decodeURIComponent(page.options.scene);
                    if (scene) {
                        scene = getApp().utils.scene_decode(scene);
                        if (scene && scene.uid) {
                            parent_id = scene.uid;
                        }
                    }
                }
                else {
                    parent_id = page.options.scene;
                }
            }
            if (parent_id) {
                wx.setStorageSync('parent_id', parent_id);
            }
        }
        if (typeof page.openWxapp === 'undefined') {
            page.openWxapp = getApp().openWxapp;
        }
        if (typeof page.showToast === 'undefined') {
            page.showToast = function (e) {
                _this.showToast(e);
            };
        }
        if (typeof page._formIdFormSubmit === 'undefined') {
            var _this = this;
            page._formIdFormSubmit = function (e) {
                _this.formIdFormSubmit(e);
            };
        }
        getApp().setNavigationBarColor();
        this.setPageNavbar(page);
        page.naveClick = function (e) {
            getApp().navigatorClick(e, page);
        };
        this.setDeviceInfo();
        this.setPageClasses();
        this.setUserInfo();
        if (typeof page.showLoadling === 'undefined') {
            page.showLoading = function (e) {
                _this.showLoading(e);
            }
        }
        if (typeof page.hideLoading === 'undefined') {
            page.hideLoading = function (e) {
                _this.hideLoading(e);
            }
        }
    },
    onReady: function (page) {
        console.log('--------pageOnReady----------');
        this.currentPage = page;
    },
    onShow: function (page) {
        console.log('--------pageOnShow----------');
        this.currentPage = page;
        getApp().order_pay.init(page, getApp());
    },
    onHide: function (page) {
        console.log('--------pageOnHide----------');
        this.currentPage = page;
    },
    onUnload: function (page) {
        console.log('--------pageOnUnload----------');
        this.currentPage = page;
    },

    showToast: function (e) {
        console.log('--- showToast ---');
        var page = this.currentPage;
        var duration = e.duration || 2500;
        var title = e.title || '';
        var success = e.success || null;
        var fail = e.fail || null;
        var complete = e.complete || null;
        if (page._toast_timer) {
            clearTimeout(page._toast_timer);
        }
        page.setData({
            _toast: {
                title: title,
            },
        });
        page._toast_timer = setTimeout(function () {
            var _toast = page.data._toast;
            _toast.hide = true;
            page.setData({
                _toast: _toast,
            });
            if (typeof complete == 'function') {
                complete();
            }
        }, duration);
    },
    formIdFormSubmit: function (e) {
        console.log('--- formIdFormSubmit ---', e);
    },
    setDeviceInfo: function () {
        var page = this.currentPage;
        //iphonex=>iPhone X(GSM+CDMA)<iPhone10,3>
        var device_list = [
            {
                id: 'device_iphone_5',
                model: 'iPhone 5',
            },
            {
                id: 'device_iphone_x',
                model: 'iPhone X',
            },
        ];
        //设置设备信息
        var device_info = wx.getSystemInfoSync();
        if (device_info.model) {
            if (device_info.model.indexOf('iPhone X') >= 0) {
                device_info.model = 'iPhone X';
            }
            for (var i in device_list) {
                if (device_list[i].model == device_info.model) {
                    page.setData({
                        __device: device_list[i].id,
                    });
                }
            }
        }
    },
    setPageNavbar: function (page) {
        console.log('----setPageNavbar----');
        var _this = this;
        var navbar = wx.getStorageSync('_navbar');
        if (navbar) {
            setNavbar(navbar);
        }
        var in_array = false;
        for (var i in this.navbarPages) {
            if (page.route == this.navbarPages[i]) {
                in_array = true;
                break;
            }
        }
        if (!in_array) {
            console.log('----setPageNavbar Return----');
            return;
        }
        getApp().request({
            url: getApp().api.default.navbar,
            success: function (res) {
                if (res.code == 0) {
                    setNavbar(res.data);
                    wx.setStorageSync('_navbar', res.data);
                    _this.setPageClasses();
                }
            }
        });

        function setNavbar(navbar) {
            var in_navs = false;
            var route = page.route || (page.__route__ || null);
            for (var i in navbar.navs) {
                if (navbar.navs[i].url === "/" + route) {
                    navbar.navs[i].active = true;
                    in_navs = true;
                } else {
                    navbar.navs[i].active = false;
                }
            }
            if (!in_navs)
                return;
            page.setData({_navbar: navbar});
        }

    },
    //加入底部导航的页面
    navbarPages: [
        'pages/index/index',
        'pages/cat/cat',
        'pages/cart/cart',
        'pages/user/user',
        'pages/list/list',
        'pages/search/search',
        'pages/topic-list/topic-list',
        'pages/video/video-list',
        'pages/miaosha/miaosha',
        'pages/shop/shop',
        'pages/pt/index/index',
        'pages/book/index/index',
        'pages/share/index',
        'pages/quick-purchase/index/index',
        'mch/m/myshop/myshop',
        'mch/shop-list/shop-list',
        'pages/integral-mall/index/index',
        'pages/integral-mall/register/index'
    ],
    setPageClasses: function () {
        var page = this.currentPage;
        var device = page.data.__device;
        var classes = device;
        if (page.data._navbar && page.data._navbar.navs && page.data._navbar.navs.length > 0) {
            classes += ' show_navbar';
        }
        if (classes)
            page.setData({
                __page_classes: classes,
            });
    },
    setUserInfo: function () {
        var page = this.currentPage;
        var userInfo = wx.getStorageSync('user_info');
        if (userInfo) {
            page.setData({
                __user_info: userInfo,
            });
        }
    },
    showLoading: function (e) {
        var page = this.currentPage;
        page.setData({
            _loading: true
        });
    },
    hideLoading: function (e) {
        var page = this.currentPage;
        page.setData({
            _loading: false
        });
    }
};