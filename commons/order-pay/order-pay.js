var api = require('../../api.js');
var app = getApp();
var pay = {
    init: function (page, _app) {
        var _this = this;
        _this.page = page;
        app = _app;

        //订单列表的订单支付
        _this.page.orderPay = function (e) {
            var index = e.currentTarget.dataset.index;
            var order_list = _this.page.data.order_list;
            var order = order_list[index];
            var pay_type_list = new Array();
            if (typeof _this.page.data.pay_type_list !== 'undefined') {
                pay_type_list = _this.page.data.pay_type_list;
            } else if (typeof order.pay_type_list !== 'undefined') {
                pay_type_list = order.pay_type_list;
            } else if (typeof order.goods_list[0].pay_type_list !== 'undefined') {
                pay_type_list = order.goods_list[0].pay_type_list;
            } else {
                var pp = {};
                pp['payment'] = 0
                pay_type_list.push(pp);
            }


            var pages = getCurrentPages();
            var new_page = pages[pages.length - 1];
            var route = new_page.route;
            var url = api.order.pay_data;
            if (route.indexOf('pt') != -1) {
                url = api.group.pay_data;
            } else if (route.indexOf('miaosha') != -1) {
                url = api.miaosha.pay_data;
            }


            if (pay_type_list.length == 1) {
                wx.showLoading({
                    title: "正在提交",
                    mask: true,
                });
                if (pay_type_list[0]['payment'] == 0) {
                    WechatPay(order.order_id, url, route);
                }
                if (pay_type_list[0]['payment'] == 3) {
                    BalancePay(order.order_id, url, route);
                }
            } else {
                wx.showModal({
                    title: '提示',
                    content: '选择支付方式',
                    cancelText: '余额支付',
                    confirmText: '微信支付',
                    success: function (res) {
                        if (res.confirm) {
                            wx.showLoading({
                                title: "正在提交",
                                mask: true,
                            });
                            WechatPay(order.order_id, url, route);
                        } else if (res.cancel) {
                            BalancePay(order.order_id, url, route);
                        }
                    }
                })
            }

            function WechatPay(order_id, url, route) {
                app.request({
                    url: url,
                    data: {
                        order_id: order_id,
                        pay_type: "WECHAT_PAY",
                    },
                    complete: function () {
                        wx.hideLoading();
                    },
                    success: function (res) {
                        if (res.code == 0) {
                            wx.requestPayment({
                                timeStamp: res.data.timeStamp,
                                nonceStr: res.data.nonceStr,
                                package: res.data.package,
                                signType: res.data.signType,
                                paySign: res.data.paySign,
                                success: function (e) {
                                    console.log("success");
                                    console.log(e);
                                },
                                fail: function (e) {
                                    console.log("fail");
                                    console.log(e);
                                },
                                complete: function (e) {

                                    if (e.errMsg == "requestPayment:fail" || e.errMsg == "requestPayment:fail cancel") {//支付失败转到待支付订单列表
                                        wx.showModal({
                                            title: "提示",
                                            content: "订单尚未支付",
                                            showCancel: false,
                                            confirmText: "确认",
                                            success: function (res) {
                                                if (res.confirm) {
                                                    wx.redirectTo({
                                                        url: "/" + route + "?status=0",
                                                    });
                                                }
                                            }
                                        });
                                        return;
                                    }


                                    wx.redirectTo({
                                        url: "/" + route + "?status=1",
                                    });


                                },
                            });
                        }
                        if (res.code == 1) {
                            wx.showToast({
                                title: res.msg,
                                image: "/images/icon-warning.png",
                            });
                        }

                    }
                });
            }
            function BalancePay(order_id, url, route) {
                var user_info = wx.getStorageSync('user_info');
                wx.showModal({
                    title: '当前账户余额：' + user_info.money,
                    content: '是否使用余额',
                    success: function (e) {
                        if (e.confirm) {
                            wx.showLoading({
                                title: "正在提交",
                                mask: true,
                            });
                            app.request({
                                url: url,
                                data: {
                                    order_id: order_id,
                                    pay_type: "BALANCE_PAY",
                                },
                                complete: function () {
                                    wx.hideLoading();
                                },
                                success: function (res) {
                                    if (res.code == 0) {
                                        wx.redirectTo({
                                            url: "/" + route + "?status=1",
                                        });
                                    }
                                    if (res.code == 1) {
                                        wx.showModal({
                                            title: '提示',
                                            content: res.msg,
                                            showCancel: false
                                        })
                                    }
                                }
                            });
                        }
                    }
                })
            }
        };


        //订单支付
        _this.page.order_submit = function (data, order_type) {
            var url_submit = api.order.submit;
            var url_pay_data = api.order.pay_data;
            var route = "/pages/order/order";
            if (order_type == 'pt') {
                url_submit = api.group.submit;
                url_pay_data = api.group.pay_data;
                route = "/pages/pt/order/order";

            } else if (order_type == 'ms') {
                url_submit = api.miaosha.submit;
                url_pay_data = api.miaosha.pay_data
                route = "/pages/miaosha/order/order";
            }

            if (data.payment == 3) {
                var user_info = wx.getStorageSync('user_info');
                wx.showModal({
                    title: '当前账户余额：' + user_info.money,
                    content: '是否确定使用余额支付',
                    success: function (e) {
                        if (e.confirm) {
                            submit_pay();
                        }
                    }
                })
            } else {
                submit_pay();
            }

            function submit_pay() {
                wx.showLoading({
                    title: "正在提交",
                    mask: true,
                });
                //提交订单
                app.request({
                    url: url_submit,
                    method: "post",
                    data: data,
                    success: function (res) {
                        if (res.code == 0) {
                            setTimeout(function () {
                                _this.page.setData({
                                    options: {},
                                });
                            }, 1);
                            var order_id = res.data.order_id || '';
                            var order_id_list = res.data.order_id_list ? JSON.stringify(res.data.order_id_list) : '';

                            var pay_type = '';
                            //获取支付数据
                            if (data.payment == 0) {
                                app.request({
                                    url: url_pay_data,
                                    data: {
                                        order_id: order_id,
                                        order_id_list: order_id_list,
                                        pay_type: 'WECHAT_PAY',
                                    },
                                    success: function (res) {
                                        if (res.code == 0) {
                                            setTimeout(function () {
                                                wx.hideLoading();
                                            }, 1000);
                                            //发起支付
                                            wx.requestPayment({
                                                timeStamp: res.data.timeStamp,
                                                nonceStr: res.data.nonceStr,
                                                package: res.data.package,
                                                signType: res.data.signType,
                                                paySign: res.data.paySign,
                                                success: function (e) {
                                                },
                                                fail: function (e) {
                                                },
                                                complete: function (e) {
                                                    if (e.errMsg == "requestPayment:fail" || e.errMsg == "requestPayment:fail cancel") {//支付失败转到待支付订单列表
                                                        wx.showModal({
                                                            title: "提示",
                                                            content: "订单尚未支付",
                                                            showCancel: false,
                                                            confirmText: "确认",
                                                            success: function (res) {
                                                                if (res.confirm) {
                                                                    wx.redirectTo({
                                                                        url: route + "?status=0",
                                                                    });
                                                                }
                                                            }
                                                        });
                                                        return;
                                                    }
                                                    if (e.errMsg == "requestPayment:ok") {
                                                        if (typeof _this.page.data.goods_card_list !== 'undefined' && _this.page.data.goods_card_list.length > 0) {
                                                            _this.page.setData({
                                                                show_card: true
                                                            });
                                                        } else {
                                                            if (order_type == 'pt') {
                                                                if (_this.page.data.type == 'ONLY_BUY') {
                                                                    wx.redirectTo({
                                                                        url: route + "?status=2",
                                                                    });
                                                                } else {
                                                                    wx.redirectTo({
                                                                        url: "/pages/pt/group/details?oid=" + order_id,
                                                                    });
                                                                }
                                                            } else {
                                                                wx.redirectTo({
                                                                    url: route + "?status=1",
                                                                });
                                                            }
                                                        }
                                                        return;
                                                    }
                                                },
                                            });

                                            var quick_list = wx.getStorageSync('quick_list')
                                            if (quick_list) {
                                                var length = quick_list.length;
                                                for (var i = 0; i < length; i++) {
                                                    var goods = quick_list[i]['goods'];
                                                    var length2 = goods.length;
                                                    for (var a = 0; a < length2; a++) {
                                                        goods[a]['num'] = 0;
                                                    }
                                                }
                                                wx.setStorageSync("quick_lists", quick_list)

                                                var carGoods = wx.getStorageSync('carGoods')
                                                var length = carGoods.length;
                                                for (var i = 0; i < length; i++) {
                                                    carGoods[i]['num'] = 0;
                                                    carGoods[i]['goods_price'] = 0;
                                                    page.setData({
                                                        'carGoods': carGoods
                                                    });
                                                }
                                                wx.setStorageSync("carGoods", carGoods)

                                                var total = wx.getStorageSync('total')
                                                if (total) {
                                                    total.total_num = 0;
                                                    total.total_price = 0;
                                                    wx.setStorageSync("total", total)
                                                }

                                                var check_num = wx.getStorageSync('check_num')
                                                check_num = 0;
                                                wx.setStorageSync("check_num", check_num)

                                                var quick_hot_goods_lists = wx.getStorageSync('quick_hot_goods_lists')
                                                var length = quick_hot_goods_lists.length;
                                                for (var i = 0; i < length; i++) {
                                                    quick_hot_goods_lists[i]['num'] = 0;
                                                    page.setData({
                                                        'quick_hot_goods_lists': quick_hot_goods_lists
                                                    });
                                                }
                                                wx.setStorageSync("quick_hot_goods_lists", quick_hot_goods_lists)
                                            }
                                            return;
                                        }

                                        if (res.code == 1) {
                                            wx.hideLoading();
                                            _this.page.showToast({
                                                title: res.msg,
                                                image: "/images/icon-warning.png",
                                            });
                                            return;
                                        }
                                    }
                                });
                            } else if (data.payment == 2) {
                                pay_type = 'HUODAO_PAY';
                                pay()
                            } else if (data.payment == 3) {
                                pay_type = 'BALANCE_PAY';
                                pay()
                            }
                            function pay() {
                                app.request({
                                    url: url_pay_data,
                                    data: {
                                        order_id: order_id,
                                        order_id_list: order_id_list,
                                        pay_type: pay_type,
                                        form_id: data.formId
                                    },
                                    success: function (res) {
                                        if (res.code == 0) {
                                            setTimeout(function () {
                                                wx.hideLoading();
                                            }, 1000);
                                            if (order_type == 'pt') {
                                                if (_this.page.data.type == 'ONLY_BUY') {
                                                    wx.redirectTo({
                                                        url: route + "?status=2",
                                                    });
                                                } else {
                                                    wx.redirectTo({
                                                        url: "/pages/pt/group/details?oid=" + order_id,
                                                    });
                                                }
                                            } else {
                                                if (typeof _this.page.data.goods_card_list !== 'undefined' && _this.page.data.goods_card_list.length > 0 && data.payment != 2) {
                                                    _this.page.setData({
                                                        show_card: true
                                                    });
                                                } else {
                                                    wx.redirectTo({
                                                        url: route + "?status=-1",
                                                    });
                                                }
                                            }
                                        } else {
                                            wx.hideLoading();
                                            _this.page.showToast({
                                                title: res.msg,
                                                image: "/images/icon-warning.png",
                                            });
                                            return;
                                        }
                                    }

                                });
                            }
                        }
                        if (res.code == 1) {
                            wx.hideLoading();
                            _this.page.showToast({
                                title: res.msg,
                                image: "/images/icon-warning.png",
                            });
                            return;
                        }
                    }
                });
            }
        }
    },
};
module.exports = pay;